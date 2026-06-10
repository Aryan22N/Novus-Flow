import { NextRequest, NextResponse } from "next/server";
import { corsair } from "~/server/corsair";
import { processOAuthCallback } from "corsair/oauth";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (!code || !state) {
            return NextResponse.redirect(new URL("/onboarding?error=missing_params", req.url));
        }

        const redirectUri = "http://localhost:3000/api/corsair/callback";

        await processOAuthCallback(corsair, {
            code,
            state,
            redirectUri,
        });

        return NextResponse.redirect(new URL("/onboarding", req.url));
    } catch (error) {
        console.error("Error handling callback:", error);
        return NextResponse.redirect(new URL("/onboarding?error=callback_failed", req.url));
    }
}
