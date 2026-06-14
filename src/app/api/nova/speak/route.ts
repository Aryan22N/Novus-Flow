import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "~/server/better-auth/config";
import { env }                       from "~/env";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json() as { text: string };
  if (!text?.trim())
    return NextResponse.json({ error: "No text provided" }, { status: 400 });

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${env.ELEVENLABS_VOICE_ID!}/stream`,
    {
      method:  "POST",
      headers: {
        "xi-api-key":   env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
        "Accept":       "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id:       "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );

  if (!response.ok)
    return NextResponse.json({ error: `ElevenLabs error: ${response.status}` }, { status: 502 });

  return new NextResponse(response.body, {
    headers: {
      "Content-Type":      "audio/mpeg",
      "Transfer-Encoding": "chunked",
    },
  });
}
