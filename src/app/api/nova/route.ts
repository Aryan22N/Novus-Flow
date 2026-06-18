import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  type Content,
  type FunctionResponsePart,
} from "@google/generative-ai";
import { auth }                                         from "~/server/better-auth/config";
import { env }                                          from "~/env";
import { NOVA_TOOLS, NOVA_SYSTEM_PROMPT }               from "~/server/voice/tools";
import { getNovaSession, saveNovaSession, createNewChat, type NovaSession } from "~/server/voice/session";
import { executeTool }                                  from "~/server/voice/actions";
import { checkLimit, incrementUsage }                   from "~/server/ai/check-limit";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);

// ── SSE helpers ───────────────────────────────────────────────────────────────

/** Returns a Response with text/event-stream headers. */
function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  });
}

/** Encodes a JSON object as a single SSE data line. */
function makeEncoder() {
  const enc = new TextEncoder();
  return (data: object) => enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json() as {
      transcript:      string;
      confirmed?:      boolean;
      chatId?:         string;
      modifiedActions?: any[];
      attachments?:    { name: string; url: string }[];
    };

    let transcriptToProcess = body.transcript;
    if (body.attachments && body.attachments.length > 0) {
      transcriptToProcess +=
        `\n\n[System Note: The user has attached the following files: ${JSON.stringify(body.attachments)}. ` +
        `If the user asks you to send an email with attachments, you must pass this exact attachments array into the sendEmail tool.]`;
    }

    const novaSession: NovaSession = await getNovaSession(session.user.id, body.chatId);

    let isNewChat = false;
    if (body.chatId && novaSession.history.length === 0 && !body.confirmed) {
      isNewChat = true;
      await createNewChat(session.user.id, body.chatId, transcriptToProcess);
      novaSession.history.push({ role: "user", parts: [{ text: transcriptToProcess }] });
      await saveNovaSession(session.user.id, novaSession, body.chatId);
    }

    // ── CONFIRMATION RESPONSE (early returns, plain JSON) ─────────────────────

    if (body.confirmed === true && (novaSession.pendingAction || novaSession.pendingActions)) {
      const actionsToRun =
        body.modifiedActions ||
        novaSession.pendingActions ||
        (novaSession.pendingAction ? [novaSession.pendingAction] : []);

      const summaries: string[] = [];
      for (const action of actionsToRun) {
        const { tool, args } = action as { tool: string; args: Record<string, unknown> };
        const result = await executeTool(`__confirmed_${tool}`, args, session, novaSession);
        summaries.push(summariseResult(tool, result.data));
      }

      novaSession.pendingAction  = undefined;
      novaSession.pendingActions = undefined;
      novaSession.history.push(
        { role: "user",  parts: [{ text: "Yes, go ahead." }] },
        { role: "model", parts: [{ text: summaries.join(" ") }] },
      );
      await saveNovaSession(session.user.id, novaSession, body.chatId);
      return NextResponse.json({ response: summaries.join(" ") });
    }

    if (body.confirmed === false && (novaSession.pendingAction || novaSession.pendingActions)) {
      novaSession.pendingAction  = undefined;
      novaSession.pendingActions = undefined;
      await saveNovaSession(session.user.id, novaSession, body.chatId);
      return NextResponse.json({ response: "Okay, I've cancelled that." });
    }

    // ── RATE LIMIT CHECK (early return, plain JSON) ───────────────────────────

    try {
      await checkLimit(session.user.id, "ai_request");
    } catch {
      return NextResponse.json({
        response: "You have reached your daily AI request limit. Please upgrade to Pro for unlimited requests.",
      });
    }

    // ── Accuracy P1 fix: inject today's date so Nova understands "this week" ──
    const todayStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year:    "numeric",
      month:   "long",
      day:     "numeric",
      timeZone: "Asia/Kolkata",
    });

    // ── Accuracy P2 fix: inject user identity for proper email sign-offs ──────
    const userIdentity =
      `\n\nYou are assisting: ${session.user.name} <${session.user.email}>. ` +
      `Use this name for email sign-offs.`;

    const dynamicSystemInstruction =
      NOVA_SYSTEM_PROMPT + userIdentity + `\n\nToday is: ${todayStr}.`;

    const model = genAI.getGenerativeModel({
      model:             "gemini-2.5-flash",
      systemInstruction: dynamicSystemInstruction,
      tools:             NOVA_TOOLS,
      generationConfig:  { temperature: 0.1 },
    });

    const historyForGemini: Content[] = novaSession.history.map((turn) => ({
      role:  turn.role,
      parts: turn.parts && turn.parts.length > 0 ? turn.parts : [{ text: "Okay." }],
    }));

    // ── AGENT LOOP — returned as SSE stream (Accuracy P5 fix) ────────────────

    const encode = makeEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chat   = model.startChat({ history: historyForGemini });
          
          const streamResponse = async (input: string | FunctionResponsePart[]) => {
            const resultStream = await withRetry(() => chat.sendMessageStream(input));
            let responseTextBuffer = "";
            for await (const chunk of resultStream.stream) {
              try {
                const text = chunk.text();
                if (text) {
                  responseTextBuffer += text;
                  controller.enqueue(encode({ chunk: text }));
                }
              } catch (e) {
                // Ignore non-text chunks
              }
            }
            const response = await resultStream.response;
            return { result: { response }, responseTextBuffer };
          };

          let { result, responseTextBuffer } = await streamResponse(transcriptToProcess);

          const allPendingActions: Array<{
            tool:  string;
            args:  Record<string, unknown>;
            draft: string;
          }> = [];

          for (let i = 0; i < 8; i++) {
            const candidate    = result.response.candidates?.[0];
            if (!candidate || !candidate.content || !candidate.content.parts) break;

            const functionCalls = candidate.content.parts.filter((p) => p.functionCall);
            if (functionCalls.length === 0) break;

            // Problem 5 fix: send the running tool name(s) to the client
            const toolNames = functionCalls
              .map((p) => p.functionCall!.name)
              .join(", ");
            controller.enqueue(encode({ status: `Running ${toolNames}…` }));

            const functionResponses: FunctionResponsePart[] = [];

            for (const part of functionCalls) {
              if (!part.functionCall) continue;

              const toolResult = await executeTool(
                part.functionCall.name,
                part.functionCall.args as Record<string, unknown>,
                session,
                novaSession,
              );

              if (toolResult.confirmationRequired) {
                allPendingActions.push({
                  tool:  toolResult.confirmationRequired.tool,
                  args:  toolResult.confirmationRequired.args,
                  draft: toolResult.confirmationRequired.draft,
                });
                functionResponses.push({
                  functionResponse: {
                    name:     part.functionCall.name,
                    response: {
                      status: "Draft prepared. User confirmation pending. You can proceed with other actions.",
                    },
                  },
                });
              } else {
                functionResponses.push({
                  functionResponse: {
                    name:     part.functionCall.name,
                    response: toolResult.data as Record<string, unknown>,
                  },
                });
              }
            }

            const streamResult = await streamResponse(functionResponses);
            result = streamResult.result;
            responseTextBuffer = streamResult.responseTextBuffer;
          }

          // ── Pending actions branch ──────────────────────────────────────────
          if (allPendingActions.length > 0) {
            novaSession.pendingActions = allPendingActions;

            const combinedDraft       = allPendingActions.map(p => `• ${p.draft}`).join("\n");
            const frontendPendingAction = { tool: "multiple", args: {}, draft: combinedDraft };
            novaSession.pendingAction   = frontendPendingAction;

            const candidate    = result.response.candidates?.[0];
            const textParts    = candidate?.content?.parts?.filter((p) => p.text).map((p) => p.text!) ?? [];
            const responseText = responseTextBuffer.length > 0 
              ? responseTextBuffer 
              : (textParts.length > 0 ? textParts.join("") : `Here's what I'll do:\n${combinedDraft}`);

            if (!isNewChat) {
              novaSession.history.push({ role: "user", parts: [{ text: transcriptToProcess }] });
            }
            novaSession.history.push({ role: "model", parts: [{ text: responseText }] });
            await saveNovaSession(session.user.id, novaSession, body.chatId);
            await incrementUsage(session.user.id, "ai_request");

            controller.enqueue(encode({
              response:            responseText,
              confirmationPending: true,
              pendingAction:       frontendPendingAction,
              pendingActions:      allPendingActions,
            }));
            controller.close();
            return;
          }

          // ── Normal response ─────────────────────────────────────────────────
          const responseText = responseTextBuffer.length > 0 
            ? responseTextBuffer 
            : (result.response.candidates?.[0]?.content?.parts
                ?.filter((p) => p.text)
                .map((p)  => p.text)
                .join("") ?? "I couldn't get a response. Please try again.");

          if (!isNewChat) {
            novaSession.history.push({ role: "user", parts: [{ text: transcriptToProcess }] });
          }
          novaSession.history.push({ role: "model", parts: [{ text: responseText }] });

          await saveNovaSession(session.user.id, novaSession, body.chatId);
          await incrementUsage(session.user.id, "ai_request");

          controller.enqueue(encode({ response: responseText }));
          controller.close();
        } catch (error: unknown) {
          console.error("Nova agent loop error:", error);
          controller.enqueue(encode({ response: "I encountered an error while processing that." }));
          controller.close();
        }
      },
    });

    return sseResponse(stream);
  } catch (error: unknown) {
    console.error("Nova API Error:", error);
    return NextResponse.json(
      { response: "I encountered an error while processing that." },
      { status: 500 },
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function summariseResult(tool: string, data: any): string {
  if (data && typeof data === "object" && data.error) {
    const cleanTool = tool.replace("__confirmed_", "");
    return `I encountered an error trying to run ${cleanTool}: ${String(data.error)}.`;
  }
  if (tool === "sendEmail")           return "Your email has been sent.";
  if (tool === "createCalendarEvent") return "The event has been added to your calendar.";
  if (tool === "deleteCalendarEvent") return "The event has been successfully deleted from your calendar.";
  return "Done.";
}

async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err?.status === 503 && i < maxRetries - 1) {
        console.warn(`Encountered 503, retrying in ${Math.pow(2, i)}s…`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries reached");
}
