import { processWebhook } from "corsair";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

import { corsair } from "../../../server/corsair";
import { db } from "../../../server/db";
import { corsairEntities, corsairAccounts } from "../../../server/db/corsair-schema";
import { user as userTable } from "../../../server/db/schema";

/**
 * Syncs a single Gmail message (received via Pub/Sub push) into the DB.
 * Handles messageReceived, messageLabelChanged (upsert) and messageDeleted (delete).
 *
 * Account lookup:
 *   Google Pub/Sub sends `emailAddress` (the Gmail address of the user).
 *   The config in corsairAccounts is fully encrypted, so we can't search it.
 *   Instead we resolve:  user.email == emailAddress  →  user.id == corsairAccounts.tenantId
 *   This works because users sign in with Google OAuth, so their user.email IS their Gmail.
 */
async function syncGmailEvent(event: {
    type: "messageReceived" | "messageDeleted" | "messageLabelChanged";
    emailAddress: string;
    historyId: string;
    message: Record<string, unknown>;
    labelsAdded?: string[];
    labelsRemoved?: string[];
}) {
    const msgId = event.message.id as string | undefined;
    if (!msgId) {
        console.warn("[gmail/pubsub] event has no message.id, skipping");
        return;
    }

    // 1. Find the user whose email matches the Gmail address in the push event
    const userRow = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, event.emailAddress))
        .limit(1);

    const tenantId = userRow[0]?.id;
    if (!tenantId) {
        console.warn(`[gmail/pubsub] No user found for emailAddress=${event.emailAddress}`);
        return;
    }

    // 2. Find the corsair account for this tenant
    const accountRow = await db
        .select({ id: corsairAccounts.id })
        .from(corsairAccounts)
        .where(eq(corsairAccounts.tenantId, tenantId))
        .limit(1);

    if (!accountRow[0]) {
        console.warn(`[gmail/pubsub] No corsair account found for tenantId=${tenantId}`);
        return;
    }

    const accountId = accountRow[0].id;

    if (event.type === "messageDeleted") {
        // Remove the message from our local store
        await db
            .delete(corsairEntities)
            .where(
                and(
                    eq(corsairEntities.accountId, accountId),
                    eq(corsairEntities.entityId, msgId),
                    eq(corsairEntities.entityType, "messages")
                )
            );
        console.info(`[gmail/pubsub] Deleted message ${msgId} from DB`);
        return;
    }

    // messageReceived or messageLabelChanged — upsert the full message
    const fullMsg = event.message;
    const version = event.historyId ?? String((fullMsg.historyId as string | undefined) ?? "1");

    const existing = await db
        .select({ id: corsairEntities.id })
        .from(corsairEntities)
        .where(
            and(
                eq(corsairEntities.accountId, accountId),
                eq(corsairEntities.entityId, msgId),
                eq(corsairEntities.entityType, "messages")
            )
        )
        .limit(1);

    if (existing.length > 0) {
        await db
            .update(corsairEntities)
            .set({
                data: fullMsg,
                updatedAt: new Date(),
                version,
            })
            .where(
                and(
                    eq(corsairEntities.accountId, accountId),
                    eq(corsairEntities.entityId, msgId),
                    eq(corsairEntities.entityType, "messages")
                )
            );
        console.info(`[gmail/pubsub] Updated message ${msgId} (${event.type})`);
    } else {
        await db.insert(corsairEntities).values({
            id: randomUUID(),
            accountId,
            entityId: msgId,
            entityType: "messages",
            version,
            data: fullMsg,
        });
        console.info(`[gmail/pubsub] Inserted new message ${msgId} (${event.type})`);
    }
}


/**
 * Syncs a single Google Calendar event (received via webhook push) into the DB.
 * Google Calendar push notifications tell us WHICH calendar changed, but not which event.
 * We respond by re-fetching all events for the next 90 days and upserting them.
 */
async function syncCalendarEvent(emailAddress: string) {
    // 1. Resolve user by email
    const userRow = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, emailAddress))
        .limit(1);

    const tenantId = userRow[0]?.id;
    if (!tenantId) {
        console.warn(`[calendar/webhook] No user found for emailAddress=${emailAddress}`);
        return;
    }

    // 2. Find the corsair account for this tenant
    const accountRow = await db
        .select({ id: corsairAccounts.id })
        .from(corsairAccounts)
        .where(eq(corsairAccounts.tenantId, tenantId))
        .limit(1);

    const accountId = accountRow[0]?.id;
    if (!accountId) {
        console.warn(`[calendar/webhook] No corsair account for tenantId=${tenantId}`);
        return;
    }

    // 3. Fetch events for the next 90 days from Google Calendar API
    const client = corsair.withTenant(tenantId);
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const result = await client.googlecalendar.api.events.getMany({
        timeMin,
        timeMax,
        maxResults: 250,
        singleEvents: true,
        orderBy: "startTime",
    }) as { items?: Record<string, unknown>[] } | null;

    const items = result?.items ?? [];

    // 4. Upsert each event into corsair_entities
    for (const event of items) {
        const eventId = event.id as string | undefined;
        if (!eventId) continue;

        const existing = await db
            .select({ id: corsairEntities.id })
            .from(corsairEntities)
            .where(
                and(
                    eq(corsairEntities.accountId, accountId),
                    eq(corsairEntities.entityId, eventId),
                    eq(corsairEntities.entityType, "events")
                )
            )
            .limit(1);

        if (existing.length > 0) {
            await db
                .update(corsairEntities)
                .set({ data: event, updatedAt: new Date(), version: (event.etag as string) ?? "1" })
                .where(
                    and(
                        eq(corsairEntities.accountId, accountId),
                        eq(corsairEntities.entityId, eventId),
                        eq(corsairEntities.entityType, "events")
                    )
                );
        } else {
            await db.insert(corsairEntities).values({
                id: randomUUID(),
                accountId,
                entityId: eventId,
                entityType: "events",
                version: (event.etag as string) ?? "1",
                data: event,
            });
        }
    }

    console.info(`[calendar/webhook] Synced ${items.length} events for tenant=${tenantId}`);
}


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
            body = await request.json() as Record<string, unknown>;
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

        // Gmail Pub/Sub push: sync the message into the DB and revalidate the inbox
        if (result.plugin === "gmail" && result.action === "messageChanged") {
            const event = result.body as {
                type: "messageReceived" | "messageDeleted" | "messageLabelChanged";
                emailAddress: string;
                historyId: string;
                message: Record<string, unknown>;
                labelsAdded?: string[];
                labelsRemoved?: string[];
            } | null;

            if (event?.type && event.message) {
                // Fire-and-forget — we don't want a DB error to break the 200 ack to Google
                syncGmailEvent(event).catch((err) =>
                    console.error("[gmail/pubsub] syncGmailEvent failed:", err)
                );
            }

            // Always revalidate the inbox so the Next.js cache is dropped
            revalidatePath("/inbox");
        }

        // Google Calendar push: an event was added/updated/deleted
        if (result.plugin === "googlecalendar") {
            const body = result.body as {
                emailAddress?: string;
                calendarId?: string;
            } | null;

            // Google Calendar push notifications carry the organiser's email
            const emailAddress = body?.emailAddress ?? body?.calendarId ?? null;

            if (emailAddress) {
                syncCalendarEvent(emailAddress).catch((err) =>
                    console.error("[calendar/webhook] syncCalendarEvent failed:", err)
                );
            }

            revalidatePath("/Calendar");
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