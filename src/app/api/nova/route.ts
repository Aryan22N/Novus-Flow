import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  type Content,
  type FunctionResponsePart,
} from "@google/generative-ai";
import { auth }                                         from "~/server/better-auth/config";
import { env }                                          from "~/env";
import { NOVA_TOOLS, NOVA_SYSTEM_PROMPT }               from "~/server/voice/tools";
import { getNovaSession, saveNovaSession, type NovaSession } from "~/server/voice/session";
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
    };

    const novaSession: NovaSession = await getNovaSession(session.user.id);

    // ── CONFIRMATION RESPONSE ─────────────────────────────────────────────────

    if (body.confirmed === true && novaSession.pendingAction) {
      const { tool, args } = novaSession.pendingAction;
      const result         = await executeTool(`__confirmed_${tool}`, args, session, novaSession);
      novaSession.pendingAction = undefined;
      novaSession.history.push(
        { role: "user",  parts: [{ text: "Yes, go ahead." }] },
        { role: "model", parts: [{ text: "Done." }] },
      );
      await saveNovaSession(session.user.id, novaSession);
      return NextResponse.json({ response: summariseResult(tool, result.data) });
    }

    if (body.confirmed === false && novaSession.pendingAction) {
      novaSession.pendingAction = undefined;
      await saveNovaSession(session.user.id, novaSession);
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
      parts: turn.parts,
    }));

    const chat   = model.startChat({ history: historyForGemini });
    let   result = await chat.sendMessage(body.transcript);

    for (let i = 0; i < 8; i++) {
      const candidate    = result.response.candidates?.[0];
      if (!candidate) break;

      const functionCalls = candidate.content.parts.filter((p) => p.functionCall);
      if (functionCalls.length === 0) break;

      const functionResponses: FunctionResponsePart[] = [];
      let   pendingAction: NovaSession["pendingAction"] | undefined;

      for (const part of functionCalls) {
        if (!part.functionCall) continue;

        const toolResult = await executeTool(
          part.functionCall.name,
          part.functionCall.args as Record<string, unknown>,
          session,
          novaSession,
        );

        if (toolResult.confirmationRequired) {
          pendingAction = {
            tool:  toolResult.confirmationRequired.tool,
            args:  toolResult.confirmationRequired.args,
            draft: toolResult.confirmationRequired.draft,
          };
          functionResponses.push({
            functionResponse: {
              name:     part.functionCall.name,
              response: { status: "awaiting_confirmation" },
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

      if (pendingAction) {
        novaSession.pendingAction = pendingAction;
        novaSession.history.push(
          { role: "user",  parts: [{ text: body.transcript }] },
          { role: "model", parts: candidate.content.parts.filter((p) => p.text).map((p) => ({ text: p.text! })) },
        );
        await saveNovaSession(session.user.id, novaSession);
        return NextResponse.json({
          response:            `Here's what I'll do: ${pendingAction.draft}`,
          confirmationPending: true,
          pendingAction,
        });
      }

      result = await chat.sendMessage(functionResponses);
    }

    const responseText =
      result.response.candidates?.[0]?.content.parts
        .filter((p) => p.text)
        .map((p) => p.text)
        .join("") ?? "I couldn't get a response. Please try again.";

    novaSession.history.push(
      { role: "user",  parts: [{ text: body.transcript }] },
      { role: "model", parts: [{ text: responseText }] },
    );
    await saveNovaSession(session.user.id, novaSession);

    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error("Nova API Error:", error);
    return NextResponse.json({ response: "I encountered an error while processing that." }, { status: 500 });
  }
}

function summariseResult(tool: string, data: unknown): string {
  if (tool === "sendEmail")           return "Your email has been sent.";
  if (tool === "createCalendarEvent") return "The event has been added to your calendar.";
  return "Done.";
}
