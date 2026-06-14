import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI }        from "@google/generative-ai";
import { auth }                      from "~/server/better-auth/config";
import { env }                       from "~/env";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData  = await req.formData();
  const audioBlob = formData.get("audio") as Blob | null;
  if (!audioBlob)
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });

  const audioBase64 = Buffer.from(await audioBlob.arrayBuffer()).toString("base64");
  const model       = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    { inlineData: { mimeType: "audio/webm", data: audioBase64 } },
    { text: "Transcribe this audio exactly. Return only the transcript, nothing else." },
  ]);

  return NextResponse.json({ transcript: result.response.text().trim() });
}
