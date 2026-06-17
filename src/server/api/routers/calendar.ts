import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { eq, and, sql, inArray } from "drizzle-orm";
import { corsairEntities, corsairAccounts } from "~/server/db/corsair-schema";
import { corsair } from "~/server/corsair";
import crypto from "crypto";
import * as chrono from "chrono-node";

function parseMeetingTime(timeStr: string): { start: Date; end: Date } {
  const parsed = chrono.parseDate(timeStr);
  const start = parsed || new Date();
  
  // If no specific time was provided (e.g. just "18 June"), default to next hour
  if (parsed && !timeStr.toLowerCase().match(/\d{1,2}\s*(am|pm)/) && !timeStr.includes(':')) {
    start.setHours(start.getHours() > 0 ? start.getHours() : 9, 0, 0, 0); 
  }

  const end = new Date(start.getTime() + 30 * 60 * 1000); // default 30 mins
  return { start, end };
}

export const calendarRouter = createTRPCRouter({
  /**
   * Get calendar events for the current month (or a given month/year).
   * First tries the local DB cache (webhook-populated corsair_entities),
   * and falls back to a live Google Calendar API call if the cache is empty.
   */
  getEvents: protectedProcedure
    .input(
      z.object({
        year: z.number().int().optional(),
        month: z.number().int().min(1).max(12).optional(), // 1-based
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;

      const now = new Date();
      const year = input.year ?? now.getFullYear();
      const month = input.month ?? now.getMonth() + 1; // convert to 1-based

      const timeMin = new Date(year, month - 1, 1).toISOString();
      const timeMax = new Date(year, month, 0, 23, 59, 59).toISOString(); // last day of month

      const parseEvent = (data: any) => {
        const startRaw = data?.start?.dateTime ?? data?.start?.date ?? null;
        const endRaw = data?.end?.dateTime ?? data?.end?.date ?? null;
        return {
          id: data?.id ?? data?.entityId ?? "",
          title: data?.summary ?? "(No title)",
          start: startRaw ? new Date(startRaw).toISOString() : null,
          end: endRaw ? new Date(endRaw).toISOString() : null,
          allDay: !data?.start?.dateTime,
          location: data?.location ?? null,
          description: data?.description ?? null,
          colorId: data?.colorId ?? null,
          status: data?.status ?? null,
          htmlLink: data?.htmlLink ?? null,
        };
      };

      // ── 1. Try local DB cache ─────────────────────────────────────────────
      try {
        const dbRows = await ctx.db
          .select({ entity: corsairEntities })
          .from(corsairEntities)
          .innerJoin(
            corsairAccounts,
            and(
              eq(corsairEntities.accountId, corsairAccounts.id),
              eq(corsairAccounts.tenantId, tenantId),
            ),
          )
          .where(
            sql`${corsairEntities.entityType} = 'events'
              AND (
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
          );

        if (dbRows.length > 0) {
          // Deduplicate + filter out any cancelled events that weren't yet purged by sync
          const seen = new Set<string>();
          const events = dbRows
            .map(({ entity }) => parseEvent(entity.data))
            .filter((ev) => {
              if (!ev.id || seen.has(ev.id)) return false;
              if (ev.status === "cancelled") return false; // skip deleted events
              seen.add(ev.id);
              return true;
            });
          return { events, source: "cache" as const };
        }
      } catch (dbErr) {
        console.error("[calendar.getEvents] DB cache fetch failed:", dbErr);
      }

      // ── 2. Fallback: live fetch from Google Calendar API ──────────────────
      try {
        const client = corsair.withTenant(tenantId) as any;
        const result = (await client.googlecalendar!.api!.events!.getMany({
          timeMin,
          timeMax,
          maxResults: 100,
          singleEvents: true,
          orderBy: "startTime",
        })) as { items?: any[] } | null;

        const items = result?.items ?? [];
        // Deduplicate by id just in case
        const seenLive = new Set<string>();
        const events = items.map(parseEvent).filter((ev) => {
          if (!ev.id || seenLive.has(ev.id)) return false;
          seenLive.add(ev.id);
          return true;
        });
        return { events, source: "live" as const };
      } catch (err) {
        console.error("[calendar.getEvents] live fetch failed:", err);
        return { events: [], source: "error" as const };
      }
    }),

  /**
   * Sync (refresh) calendar events from Google Calendar API into local DB.
   */
  syncEvents: protectedProcedure
    .input(
      z.object({
        daysAhead: z.number().int().min(1).max(365).default(60),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const client = corsair.withTenant(tenantId) as any;

      const now = new Date();
      const timeMin = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();
      const timeMax = new Date(
        Date.now() + input.daysAhead * 24 * 60 * 60 * 1000,
      ).toISOString();

      // Get all account rows for the tenant (to handle duplicates)
      const accountRows = await ctx.db
        .select({ id: corsairAccounts.id })
        .from(corsairAccounts)
        .where(eq(corsairAccounts.tenantId, tenantId));

      if (accountRows.length === 0) return { synced: 0, deleted: 0, total: 0 };

      const accountIds = accountRows.map((r) => r.id);
      const primaryAccountId = accountIds[0]!;

      let result: { items?: any[] } | null = null;
      try {
        // showDeleted: true → Google returns cancelled events so we can delete them
        result = (await client.googlecalendar!.api!.events!.getMany({
          timeMin,
          timeMax,
          maxResults: 250,
          singleEvents: true,
          orderBy: "startTime",
          showDeleted: true,
        })) as { items?: any[] } | null;
      } catch (err) {
        console.error("[syncEvents] Google Calendar API error:", err);
        return { synced: 0, deleted: 0, total: 0 };
      }

      const items = result?.items ?? [];

      // Separate cancelled (deleted) events from active ones
      const cancelledIds = items
        .filter((e: any) => e?.status === "cancelled" && e?.id)
        .map((e: any) => e.id as string);

      const activeItems = items.filter(
        (e: any) => e?.id && e?.status !== "cancelled",
      );

      // ── 1. Delete cancelled events from the DB ────────────────────────────
      let deleted = 0;
      for (const eventId of cancelledIds) {
        try {
          const result = await ctx.db
            .delete(corsairEntities)
            .where(
              and(
                inArray(corsairEntities.accountId, accountIds),
                eq(corsairEntities.entityId, eventId),
                eq(corsairEntities.entityType, "events"),
              ),
            );
          // drizzle returns the deleted row count in .rowCount (postgres)
          if ((result as any).rowCount > 0) deleted++;
        } catch (err) {
          console.error(`[syncEvents] failed to delete event ${eventId}:`, err);
        }
      }

      // ── 2. Build the set of active event IDs from Google ─────────────────
      const activeIds = new Set(activeItems.map((e: any) => e.id as string));

      // ── 3. Find DB events in this time window that Google didn't return ───
      //    These are fully purged events (not even returned as cancelled).
      const dbRows = await ctx.db
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

      console.log(
        `[syncEvents] Found ${dbRows.length} events in DB for this window`,
      );
      console.log(
        `[syncEvents] activeIds count: ${activeIds.size}, cancelledIds count: ${cancelledIds.length}`,
      );

      for (const row of dbRows) {
        if (
          !activeIds.has(row.entityId) &&
          !cancelledIds.includes(row.entityId)
        ) {
          console.log(`[syncEvents] Purging stale event ${row.entityId}`);
          // This event is no longer returned by Google for this window → purge it
          try {
            await ctx.db
              .delete(corsairEntities)
              .where(
                and(
                  eq(corsairEntities.accountId, row.accountId),
                  eq(corsairEntities.entityId, row.entityId),
                  eq(corsairEntities.entityType, "events"),
                ),
              );
            deleted++;
          } catch (err) {
            console.error(
              `[syncEvents] failed to purge stale event ${row.entityId}:`,
              err,
            );
          }
        }
      }

      // ── 4. Upsert active events ───────────────────────────────────────────
      let synced = 0;
      for (const event of activeItems) {
        try {
          const existing = await ctx.db
            .select({ id: corsairEntities.id })
            .from(corsairEntities)
            .where(
              and(
                inArray(corsairEntities.accountId, accountIds),
                eq(corsairEntities.entityId, event.id),
                eq(corsairEntities.entityType, "events"),
              ),
            )
            .limit(1);

          if (existing.length > 0) {
            await ctx.db
              .update(corsairEntities)
              .set({
                data: event,
                updatedAt: new Date(),
                version: event.etag ?? "1",
              })
              .where(
                and(
                  inArray(corsairEntities.accountId, accountIds),
                  eq(corsairEntities.entityId, event.id),
                  eq(corsairEntities.entityType, "events"),
                ),
              );
          } else {
            await ctx.db.insert(corsairEntities).values({
              id: crypto.randomUUID(),
              accountId: primaryAccountId,
              entityId: event.id,
              entityType: "events",
              version: event.etag ?? "1",
              data: event,
            });
            synced++;
          }
        } catch (err) {
          console.error(`[syncEvents] failed for event ${event.id}:`, err);
        }
      }

      return { synced, deleted, total: items.length };
    }),

  /**
   * Create a new event on Google Calendar via Corsair API.
   */
  createEvent: protectedProcedure
    .input(
      z.object({
        summary: z.string(),
        description: z.string().optional(),
        meetingTime: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const client = corsair.withTenant(tenantId) as any;

      const { start, end } = parseMeetingTime(input.meetingTime);

      try {
        const result = await client.googlecalendar!.api!.events!.create({
          calendarId: "primary",
          event: {
            summary: input.summary,
            description: input.description ?? "",
            start: {
              dateTime: start.toISOString(),
            },
            end: {
              dateTime: end.toISOString(),
            },
          },
        });

        // Sync directly into database cache
        const accountRow = await ctx.db
          .select({ id: corsairAccounts.id })
          .from(corsairAccounts)
          .where(eq(corsairAccounts.tenantId, tenantId))
          .limit(1);

        const accountId = accountRow[0]?.id;
        if (accountId && result?.id) {
          await ctx.db.insert(corsairEntities).values({
            id: crypto.randomUUID(),
            accountId,
            entityId: result.id,
            entityType: "events",
            version: (result as any).etag ?? "1",
            data: result,
          });
        }

        return { success: true, event: result };
      } catch (err) {
        console.error("[calendar.createEvent] failed:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Failed to create event in Google Calendar",
        });
      }
    }),

  /**
   * Delete an event on Google Calendar and local DB.
   */
  deleteEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const client = corsair.withTenant(tenantId) as any;

      try {
        await client.googlecalendar!.api!.events!.delete({
          calendarId: "primary",
          id: input.eventId,
        });

        await ctx.db
          .delete(corsairEntities)
          .where(eq(corsairEntities.entityId, input.eventId));

        return { success: true };
      } catch (err) {
        console.error(`[calendar.deleteEvent] failed for event ${input.eventId}:`, err);
        throw new Error("Failed to delete event in Google Calendar");
      }
    }),

  /**
   * Registers a Google Calendar push-notification watch channel so that
   * Google calls our /api/webhooks endpoint whenever any event changes.
   * Must be called once after the user connects their Google account.
   * The channel expires after at most 7 days — call again to renew.
   */
  registerWebhook: protectedProcedure.mutation(async ({ ctx }) => {
    const tenantId = ctx.session.user.id;
    const client = corsair.withTenant(tenantId) as any;

    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks`
      : null;

    // In local dev without a public URL, skip registration entirely
    if (!webhookUrl || webhookUrl.includes("localhost")) {
      console.info(
        "[registerWebhook] Skipping — no public URL configured (set NEXT_PUBLIC_APP_URL)",
      );
      return { success: false as const, reason: "no_public_url" };
    }

    try {
      // Get a fresh access token via the corsair client
      const accessToken: string =
        (await (client.googlecalendar as any)._getAccessToken?.()) ??
        (client.googlecalendar as any).key;

      const channelId = `cal-${tenantId}-${Date.now()}`;
      const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;

      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events/watch",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: channelId,
            type: "web_hook",
            address: webhookUrl,
            params: { ttl: String(Math.floor(expiration / 1000)) },
          }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        console.warn(
          "[registerWebhook] Google rejected the watch request:",
          errText,
        );
        return { success: false as const, reason: errText };
      }

      const channel = (await res.json()) as {
        id: string;
        resourceId: string;
        expiration: string;
      };

      console.info(
        `[registerWebhook] Channel registered: id=${channel.id} expires=${channel.expiration}`,
      );

      return {
        success: true as const,
        channelId: channel.id,
        resourceId: channel.resourceId,
        expiration: channel.expiration,
      };
    } catch (err) {
      console.warn("[registerWebhook] Unexpected error:", err);
      return {
        success: false as const,
        reason: err instanceof Error ? err.message : "unknown",
      };
    }
  }),
});
