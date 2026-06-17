import { processWebhook } from "corsair";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq, and, sql, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

import { corsair } from "../../../server/corsair";
import { db } from "../../../server/db";
import {
  corsairEntities,
  corsairAccounts,
} from "../../../server/db/corsair-schema";
import { user as userTable } from "../../../server/db/schema";
import { getHeader } from "../../../server/utils/email-parsing";
import { upsertContactsForEmail } from "../../../server/utils/contacts";

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
    console.warn(
      `[gmail/pubsub] No user found for emailAddress=${event.emailAddress}`,
    );
    return;
  }

  // 2. Find the corsair account for this tenant
  const accountRow = await db
    .select({ id: corsairAccounts.id })
    .from(corsairAccounts)
    .where(eq(corsairAccounts.tenantId, tenantId))
    .limit(1);

  if (!accountRow[0]) {
    console.warn(
      `[gmail/pubsub] No corsair account found for tenantId=${tenantId}`,
    );
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
          eq(corsairEntities.entityType, "messages"),
        ),
      );
    console.info(`[gmail/pubsub] Deleted message ${msgId} from DB`);
    return;
  }

  // messageReceived or messageLabelChanged — upsert the full message
  let fullMsg = event.message;
  const version =
    event.historyId ?? String((fullMsg.historyId as string | undefined) ?? "1");

  try {
    const client = corsair.withTenant(tenantId) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchedMsg = (await client.gmail!.api!.messages!.get({
      id: msgId,
      format: "full",
    })) as any;

    if (fetchedMsg) {
      fullMsg = fetchedMsg;
    }
  } catch (e) {
    console.error(`[gmail/pubsub] Failed to fetch full message ${msgId}:`, e);
  }

  const existing = await db
    .select({ id: corsairEntities.id })
    .from(corsairEntities)
    .where(
      and(
        eq(corsairEntities.accountId, accountId),
        eq(corsairEntities.entityId, msgId),
        eq(corsairEntities.entityType, "messages"),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(corsairEntities)
      .set({
        data: fullMsg,
        updatedAt: new Date(),
        version,
        isRead: !((fullMsg as any)?.labelIds?.includes("UNREAD")),
      })
      .where(
        and(
          eq(corsairEntities.accountId, accountId),
          eq(corsairEntities.entityId, msgId),
          eq(corsairEntities.entityType, "messages"),
        ),
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
      isRead: !((fullMsg as any)?.labelIds?.includes("UNREAD")),
    });
    console.info(
      `[gmail/pubsub] Inserted new message ${msgId} (${event.type})`,
    );

    // Upsert contacts for newly synced received email via Pub/Sub push
    const headers = ((fullMsg as any)?.payload?.headers ?? []) as { name: string; value: string }[];
    const fromHeader = getHeader(headers, "From");
    const toHeader = getHeader(headers, "To");
    const ccHeader = getHeader(headers, "Cc");
    const dateHeader = getHeader(headers, "Date");
    const emailDate = dateHeader ? new Date(dateHeader) : new Date();

    void upsertContactsForEmail({
      db,
      userId: tenantId,
      userEmail: event.emailAddress,
      from: fromHeader,
      to: toHeader,
      cc: ccHeader,
      date: emailDate,
    }).catch((err) =>
      console.error(`[gmail/pubsub] upsertContactsForEmail failed:`, err),
    );
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
    console.warn(
      `[calendar/webhook] No user found for emailAddress=${emailAddress}`,
    );
    return;
  }

  // 2. Find the corsair account for this tenant
  const accountRows = await db
    .select({ id: corsairAccounts.id })
    .from(corsairAccounts)
    .where(eq(corsairAccounts.tenantId, tenantId));

  if (accountRows.length === 0) {
    console.error(
      `[calendar/webhook] No account found for tenantId: ${tenantId}`,
    );
    return;
  }

  const accountIds = accountRows.map((r) => r.id);
  const primaryAccountId = accountIds[0]!;

  // 3. Fetch events from start of month to 90 days ahead
  const client = corsair.withTenant(tenantId) as any;
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const result = (await client.googlecalendar!.api!.events!.getMany({
    timeMin,
    timeMax,
    maxResults: 250,
    singleEvents: true,
    orderBy: "startTime",
    showDeleted: true,
  })) as { items?: Record<string, unknown>[] } | null;

  const items = result?.items ?? [];

  const cancelledIds = items
    .filter((e: any) => e?.status === "cancelled" && e?.id)
    .map((e: any) => e.id as string);

  const activeItems = items.filter(
    (e: any) => e?.id && e?.status !== "cancelled",
  );

  // 4. Delete explicitly cancelled events
  for (const eventId of cancelledIds) {
    await db
      .delete(corsairEntities)
      .where(
        and(
          inArray(corsairEntities.accountId, accountIds),
          eq(corsairEntities.entityId, eventId),
          eq(corsairEntities.entityType, "events"),
        ),
      );
  }

  const activeIds = new Set(activeItems.map((e: any) => e.id as string));

  // 5. Purge stale events in this time window that Google didn't return
  const dbRows = await db
    .select({
      entityId: corsairEntities.entityId,
      accountId: corsairEntities.accountId,
    })
    .from(corsairEntities)
    .where(
      and(
        inArray(corsairEntities.accountId, accountIds),
        eq(corsairEntities.entityType, "events"),
        sql`(
                  (${corsairEntities.data}->>'start' IS NOT NULL
                    AND (${corsairEntities.data}->'start'->>'dateTime') IS NOT NULL
                    AND (${corsairEntities.data}->'start'->>'dateTime')::timestamptz >= ${timeMin}::timestamptz
                    AND (${corsairEntities.data}->'start'->>'dateTime')::timestamptz <= ${timeMax}::timestamptz
                  )
                  OR
                  ((${corsairEntities.data}->'start'->>'date') >= ${timeMin.substring(0, 10)}
                    AND (${corsairEntities.data}->'start'->>'date') <= ${timeMax.substring(0, 10)}
                  )
                )`,
      ),
    );

  for (const row of dbRows) {
    if (!activeIds.has(row.entityId) && !cancelledIds.includes(row.entityId)) {
      await db
        .delete(corsairEntities)
        .where(
          and(
            eq(corsairEntities.accountId, row.accountId),
            eq(corsairEntities.entityId, row.entityId),
            eq(corsairEntities.entityType, "events"),
          ),
        );
    }
  }

  // 6. Upsert active events
  for (const event of activeItems) {
    const eventId = event.id as string | undefined;
    if (!eventId) continue;

    const existing = await db
      .select({ id: corsairEntities.id })
      .from(corsairEntities)
      .where(
        and(
          inArray(corsairEntities.accountId, accountIds),
          eq(corsairEntities.entityId, eventId),
          eq(corsairEntities.entityType, "events"),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(corsairEntities)
        .set({
          data: event,
          updatedAt: new Date(),
          version: (event.etag as string) ?? "1",
        })
        .where(
          and(
            inArray(corsairEntities.accountId, accountIds),
            eq(corsairEntities.entityId, eventId),
            eq(corsairEntities.entityType, "events"),
          ),
        );
    } else {
      await db.insert(corsairEntities).values({
        id: randomUUID(),
        accountId: primaryAccountId,
        entityId: eventId,
        entityType: "events",
        version: (event.etag as string) ?? "1",
        data: event,
      });
    }
  }

  console.info(
    `[calendar/webhook] Synced calendar events for tenant=${tenantId}`,
  );
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
      body = (await request.json()) as Record<string, unknown>;
    } else {
      const text = await request.text();
      body = text && text.trim() ? text : {};
    }

    // Resolve tenantId from query params, fallback to undefined so Corsair handles it if possible
    const { searchParams } = new URL(request.url);
    const tenantId =
      searchParams.get("tenantId") ||
      searchParams.get("accountId") ||
      undefined;

    const result = await processWebhook(
      corsair,
      headers,
      body,
      tenantId ? { tenantId } : {},
    );

    console.info("Plugin Processed:", result.plugin, result.action);

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
        },
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
        void syncGmailEvent(event).catch((err) =>
          console.error("[gmail/pubsub] syncGmailEvent failed:", err),
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
        void syncCalendarEvent(emailAddress).catch((err) =>
          console.error("[calendar/webhook] syncCalendarEvent failed:", err),
        );
      }

      revalidatePath("/Calendar");
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
      { status: 500 },
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
