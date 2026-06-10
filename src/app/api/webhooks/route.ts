import { processWebhook } from "corsair";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { corsair } from "../../../server/corsair";

export async function POST(request: NextRequest) {
    try {
        // Convert headers to plain object
        const headers: Record<string, string> = {};

        request.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const contentType = request.headers.get("content-type");

        let body: string | Record<string, unknown>;

        if (contentType?.includes("application/json")) {
            body = await request.json();
        } else {
            const text = await request.text();
            body = text && text.trim() ? text : {};
        }

        // Resolve tenantId from query params, fallback to undefined so Corsair handles it if possible
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get("tenantId") || searchParams.get("accountId") || undefined;

        const result = await processWebhook(
            corsair,
            headers,
            body,
            tenantId ? { tenantId } : {}
        );

        console.info(
            "Plugin Processed:",
            result.plugin,
            result.action
        );

        const nextHeaders = new Headers();

        if (result.responseHeaders) {
            for (const [key, value] of Object.entries(result.responseHeaders)) {
                nextHeaders.set(key, String(value));
            }
        }

        // No matching webhook
        if (!result.plugin) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No matching webhook handler found",
                },
                {
                    status: 404,
                    headers: nextHeaders,
                }
            );
        }

        // Revalidate the inbox so the Next.js cache is dropped
        // and the frontend picks up new messages immediately
        if (result.plugin === "gmail") {
            revalidatePath("/inbox");
        }

        return NextResponse.json(result.response || { success: true }, {
            status: 200,
            headers: nextHeaders,
        });
    } catch (error) {
        console.error("Webhook Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Webhook processing failed",
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        status: "ok",
        message: "Webhook endpoint is active",
        timestamp: new Date().toISOString(),
    });
}