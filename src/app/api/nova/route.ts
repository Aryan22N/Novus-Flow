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

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json() as {
      transcript: string;
      confirmed?: boolean;
      chatId?: string;
      modifiedActions?: any[];
      attachments?: { name: string; url: string }[];
    };

    let transcriptToProcess = body.transcript;
    if (body.attachments && body.attachments.length > 0) {
      transcriptToProcess += `\n\n[System Note: The user has attached the following files: ${JSON.stringify(body.attachments)}. If the user asks you to send an email with attachments, you must pass this exact attachments array into the sendEmail tool.]`;
    }

    const novaSession: NovaSession = await getNovaSession(session.user.id, body.chatId);
    
    let isNewChat = false;
    if (body.chatId && novaSession.history.length === 0 && !body.confirmed) {
      isNewChat = true;
      await createNewChat(session.user.id, body.chatId, transcriptToProcess);
      novaSession.history.push({ role: "user", parts: [{ text: transcriptToProcess }] });
      await saveNovaSession(session.user.id, novaSession, body.chatId);
    }

    // ── CONFIRMATION RESPONSE ─────────────────────────────────────────────────

    if (body.confirmed === true && (novaSession.pendingAction || novaSession.pendingActions)) {
      const actionsToRun = body.modifiedActions || novaSession.pendingActions || (novaSession.pendingAction ? [novaSession.pendingAction] : []);
      const summaries: string[] = [];
      
      for (const action of actionsToRun) {
        const { tool, args } = action;
        const result         = await executeTool(`__confirmed_${tool}`, args, session, novaSession);
        summaries.push(summariseResult(tool, result.data));
      }

      novaSession.pendingAction = undefined;
      novaSession.pendingActions = undefined;
      novaSession.history.push(
        { role: "user",  parts: [{ text: "Yes, go ahead." }] },
        { role: "model", parts: [{ text: summaries.join(" ") }] },
      );
      await saveNovaSession(session.user.id, novaSession, body.chatId);
      return NextResponse.json({ response: summaries.join(" ") });
    }

    if (body.confirmed === false && (novaSession.pendingAction || novaSession.pendingActions)) {
      novaSession.pendingAction = undefined;
      novaSession.pendingActions = undefined;
      await saveNovaSession(session.user.id, novaSession, body.chatId);
      return NextResponse.json({ response: "Okay, I've cancelled that." });
    }

    // ── AGENT LOOP ────────────────────────────────────────────────────────────

    const model = genAI.getGenerativeModel({
      model:             "gemini-2.5-flash",
      systemInstruction: NOVA_SYSTEM_PROMPT,
      tools:             NOVA_TOOLS,
      generationConfig:  { temperature: 0.1 },
    });

    const historyForGemini: Content[] = novaSession.history.map((turn) => ({
      role:  turn.role,
      parts: turn.parts && turn.parts.length > 0 ? turn.parts : [{ text: "Okay." }],
    }));

    const chat   = model.startChat({ history: historyForGemini });
    let   result = await withRetry(() => chat.sendMessage(transcriptToProcess));

    const allPendingActions: Array<{ tool: string; args: Record<string, unknown>; draft: string }> = [];

    for (let i = 0; i < 8; i++) {
      const candidate    = result.response.candidates?.[0];
      if (!candidate) break;

      const functionCalls = candidate.content.parts.filter((p) => p.functionCall);
      if (functionCalls.length === 0) break;

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
              response: { status: "Draft prepared. User confirmation pending. You can proceed with other actions." },
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

      result = await withRetry(() => chat.sendMessage(functionResponses));
    }

    if (allPendingActions.length > 0) {
      novaSession.pendingActions = allPendingActions;
      
      const combinedDraft = allPendingActions.map(p => `• ${p.draft}`).join('\n');
      const frontendPendingAction = {
        tool: "multiple",
        args: {},
        draft: combinedDraft
      };

      novaSession.pendingAction = frontendPendingAction;

      const candidate = result.response.candidates?.[0];
      const textParts = candidate?.content.parts.filter((p) => p.text).map((p) => ({ text: p.text! })) || [];
      const responseText = textParts.length > 0 ? textParts.map(t => t.text).join("") : `Here's what I'll do:\n${combinedDraft}`;

      if (!isNewChat) {
        novaSession.history.push({ role: "user", parts: [{ text: transcriptToProcess }] });
      }
      novaSession.history.push(
        { role: "model", parts: [{ text: responseText }] },
      );
      await saveNovaSession(session.user.id, novaSession, body.chatId);
      return NextResponse.json({
        response:            responseText,
        confirmationPending: true,
        pendingAction:       frontendPendingAction,
        pendingActions:      allPendingActions,
      });
    }

    const responseText =
      result.response.candidates?.[0]?.content.parts
        .filter((p) => p.text)
        .map((p) => p.text)
        .join("") ?? "I couldn't get a response. Please try again.";

    if (!isNewChat) {
      novaSession.history.push({ role: "user", parts: [{ text: transcriptToProcess }] });
    }
    novaSession.history.push({ role: "model", parts: [{ text: responseText }] });
    
    await saveNovaSession(session.user.id, novaSession, body.chatId);

    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error("Nova API Error:", error);
    return NextResponse.json({ response: "I encountered an error while processing that." }, { status: 500 });
  }
}

function summariseResult(tool: string, data: unknown): string {
  if (tool === "sendEmail")           return "Your email has been sent.";
  if (tool === "createCalendarEvent") return "The event has been added to your calendar.";
  if (tool === "deleteCalendarEvent") return "The event has been successfully deleted from your calendar.";
  return "Done.";
}

async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error?.status === 503 && i < maxRetries - 1) {
        console.warn(`Encountered 503 error, retrying in ${Math.pow(2, i)} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries reached");
}
