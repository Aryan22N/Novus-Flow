import { NextRequest, NextResponse } from "next/server";
import { corsair } from "~/server/corsair";
import { getSession } from "~/server/better-auth/server";
import { headers } from "next/headers";
import { generateOAuthUrl } from "corsair/oauth";
import { env } from "~/env";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const plugin = searchParams.get("plugin");

  if (!plugin || typeof plugin !== "string") {
    return NextResponse.json({ error: "Missing plugin" }, { status: 400 });
  }

  const tenantId = session.user.id;
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/corsair/callback`;

  try {
    const { url } = await generateOAuthUrl(corsair, plugin, {
      tenantId,
      redirectUri,
    });

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Error generating connect link:", error);
    return NextResponse.json(
      { error: "Failed to generate connect link" },
      { status: 500 },
    );
  }
}
