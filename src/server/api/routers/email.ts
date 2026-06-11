import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { eq, desc, sql, and } from "drizzle-orm";
import { corsairEntities, corsairAccounts } from "~/server/db/corsair-schema";
import { sentMail } from "~/server/db/schema";
import { corsair } from "~/server/corsair";
import { randomUUID } from "crypto";

function getHeader(
  headers: { name: string; value: string }[],
  name: string
) {
  return headers.find(
    (header) => header.name.toLowerCase() === name.toLowerCase()
  )?.value;
}

function extractSender(fromHeader?: string) {
  if (!fromHeader) return "Unknown";

  // ngrok team <team@m.ngrok.com>
  const match = fromHeader.match(/^(.+?)\s*</);

  if (match?.[1]) {
    return match[1].replace(/"/g, "");
  }

  return fromHeader;
}

function decodeBase64Url(base64UrlStr: string) {
  try {
    const base64 = base64UrlStr.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch (e) {
    return "";
  }
}

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

function parsePayload(payload: any) {
  let htmlBody = "";
  let plainBody = "";
  let attachments: Attachment[] = [];

  function traverse(part: any) {
    if (!part) return;

    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size || 0,
      });
    }

    if (part.mimeType === "text/html" && part.body?.data) {
      htmlBody = decodeBase64Url(part.body.data);
    } else if (part.mimeType === "text/plain" && part.body?.data) {
      plainBody = decodeBase64Url(part.body.data);
    }

    if (part.parts) {
      for (const p of part.parts) {
        traverse(p);
      }
    }
  }

  traverse(payload);

  // If no parts array but body data is present on the top-level payload
  if (!payload?.parts && payload?.body?.data) {
    if (payload.mimeType === "text/html") {
      htmlBody = decodeBase64Url(payload.body.data);
    } else if (payload.mimeType === "text/plain") {
      plainBody = decodeBase64Url(payload.body.data);
    }
  }

  return { htmlBody, plainBody, attachments };
}

export const emailRouter = createTRPCRouter({
  getInboxThreads: protectedProcedure
    .input(z.object({ page: z.number().int().min(1).default(1) }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const PAGE_SIZE = 50;

      const messages = await ctx.db
        .select({ entity: corsairEntities })
        .from(corsairEntities)
        .innerJoin(
          corsairAccounts,
          and(
            eq(corsairEntities.accountId, corsairAccounts.id),
            eq(corsairAccounts.tenantId, tenantId)
          )
        )
        .where(eq(corsairEntities.entityType, "messages"));

      // Deduplicate by Gmail message ID in case of multiple accounts for the same tenant
      const seen = new Set<string>();

      const allEmails = messages
        .map(({ entity: message }) => {
          const data = message.data as any;

          const headers = data?.payload?.headers ?? [];

          const from = getHeader(headers, "From");

          const dateHeader = getHeader(headers, "Date");
          const headerTimestamp = dateHeader ? new Date(dateHeader).getTime() : NaN;

          return {
            id: message.entityId,
            threadId: data.threadId,

            sender: extractSender(from),

            senderEmail:
              from?.match(/<(.+?)>/)?.[1] ?? from,

            subject: data.subject ?? "(no subject)",

            snippet: data.snippet ?? "",

            unread: data.labelIds?.includes("UNREAD"),

            date: new Date(
              data.internalDate
                ? Number(data.internalDate)
                : !Number.isNaN(headerTimestamp)
                  ? headerTimestamp
                  : data.createdAt || Date.now()
            ),
          };
        })
        .filter((email) => {
          if (seen.has(email.id)) return false;
          seen.add(email.id);
          return true;
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      const total = allEmails.length;
      const offset = (input.page - 1) * PAGE_SIZE;
      const emails = allEmails.slice(offset, offset + PAGE_SIZE);

      return {
        emails,
        total,
        page: input.page,
        pageSize: PAGE_SIZE,
        pageCount: Math.ceil(total / PAGE_SIZE),
      };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.session.user.id;
    const messages = await ctx.db
      .select({ entity: corsairEntities })
      .from(corsairEntities)
      .innerJoin(
        corsairAccounts,
        and(
          eq(corsairEntities.accountId, corsairAccounts.id),
          eq(corsairAccounts.tenantId, tenantId)
        )
      )
      .where(eq(corsairEntities.entityType, "messages"));

    const seen = new Set<string>();
    const unreadCount = messages
      .filter(({ entity: message }) => {
        if (seen.has(message.entityId)) return false;
        seen.add(message.entityId);
        const data = message.data as any;
        return data?.labelIds?.includes("UNREAD");
      }).length;

    return { count: unreadCount };
  }),

  markThreadAsRead: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const client = corsair.withTenant(tenantId);

      // Get all message entities belonging to this thread and tenant
      const messages = await ctx.db
        .select({ entity: corsairEntities })
        .from(corsairEntities)
        .innerJoin(
          corsairAccounts,
          and(
            eq(corsairEntities.accountId, corsairAccounts.id),
            eq(corsairAccounts.tenantId, tenantId)
          )
        )
        .where(
          sql`${corsairEntities.entityType} = 'messages' AND ${corsairEntities.data}->>'threadId' = ${input.threadId}`
        );

      // Modify the thread labels in Gmail (batch remove UNREAD label)
      const messageIds = messages
        .map(({ entity: msg }) => msg.entityId)
        .filter(Boolean);

      if (messageIds.length > 0) {
        try {
          await client.gmail.api.messages.batchModify({
            ids: messageIds,
            removeLabelIds: ["UNREAD"],
          });
        } catch (err) {
          console.error(`Failed to remove UNREAD label from messages in Gmail:`, err);
        }
      }

      // Update local DB cache so that getUnreadCount reflects this immediately
      for (const { entity: msg } of messages) {
        const data = msg.data as any;
        if (data?.labelIds?.includes("UNREAD")) {
          const updatedLabelIds = (data.labelIds as string[]).filter((label) => label !== "UNREAD");
          await ctx.db
            .update(corsairEntities)
            .set({
              data: {
                ...data,
                labelIds: updatedLabelIds,
              },
              updatedAt: new Date(),
            })
            .where(eq(corsairEntities.id, msg.id));
        }
      }

      return { success: true };
    }),

  getThread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;

      const messagesResult = await ctx.db
        .select({ entity: corsairEntities })
        .from(corsairEntities)
        .innerJoin(
          corsairAccounts,
          and(
            eq(corsairEntities.accountId, corsairAccounts.id),
            eq(corsairAccounts.tenantId, tenantId)
          )
        )
        .where(
          sql`${corsairEntities.entityType} = 'messages' AND ${corsairEntities.data}->>'threadId' = ${input.threadId}`
        )
        .orderBy(desc(corsairEntities.createdAt));

      // Deduplicate by message ID
      const seenIds = new Set<string>();
      const dedupedResult = messagesResult.filter(({ entity }) => {
        if (seenIds.has(entity.entityId)) return false;
        seenIds.add(entity.entityId);
        return true;
      });

      const messages = dedupedResult.map(({ entity: message }) => {
        const data = message.data as any;
        const headers = data?.payload?.headers ?? [];

        const from = getHeader(headers, "From");
        const to = getHeader(headers, "To");
        const cc = getHeader(headers, "Cc");
        const subject = data.subject ?? getHeader(headers, "Subject") ?? "(no subject)";

        const { htmlBody, plainBody, attachments } = parsePayload(data.payload);

        const dateHeader = getHeader(headers, "Date");
        const headerTimestamp = dateHeader ? new Date(dateHeader).getTime() : NaN;

        return {
          id: message.entityId,
          threadId: data.threadId,
          sender: extractSender(from),
          senderEmail: from?.match(/<(.+?)>/)?.[1] ?? from,
          to,
          cc,
          subject,
          snippet: data.snippet ?? "",
          htmlBody,
          plainBody,
          attachments,
          unread: data.labelIds?.includes("UNREAD"),
          date: new Date(
            data.internalDate
              ? Number(data.internalDate)
              : !Number.isNaN(headerTimestamp)
                ? headerTimestamp
                : data.createdAt || Date.now()
          ),
        };
      });

      // Threads usually displayed chronologically from oldest to newest
      messages.reverse();

      const threadSubject = messages[0]?.subject || "(no subject)";

      return {
        id: input.threadId,
        subject: threadSubject,
        messages,
      };
    }),

  refreshInbox: protectedProcedure.mutation(async ({ ctx }) => {
    const tenantId = ctx.session.user.id;

    // Use the corsair client to fetch latest messages from Gmail API
    const client = corsair.withTenant(tenantId);

    // Fetch the latest 50 INBOX messages
    const listResult = await client.gmail.api.messages.list({
      maxResults: 50,
      labelIds: ["INBOX"],
    }) as { messages?: { id: string }[] } | null;

    const messageIds = listResult?.messages ?? [];

    if (messageIds.length === 0) {
      return { synced: 0, total: 0 };
    }

    // Get the user's Gmail account row (needed to link entities)
    // Filter to gmail integration only in case user has multiple integrations
    const accountRow = await ctx.db
      .select({ id: corsairAccounts.id })
      .from(corsairAccounts)
      .where(eq(corsairAccounts.tenantId, tenantId))
      .limit(1);

    const accountId = accountRow[0]?.id;
    if (!accountId) return { synced: 0, total: 0 };

    let synced = 0;

    for (const msg of messageIds) {
      try {
        // Fetch full message (typed as any — Corsair's Gmail return type is not publicly exported)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fullMsg = await client.gmail.api.messages.get({
          id: msg.id,
          format: "full",
        }) as any;

        if (!fullMsg) continue;

        const version = String(fullMsg.historyId ?? "1");

        // Upsert: update if exists, insert if new
        const existing = await ctx.db
          .select({ id: corsairEntities.id })
          .from(corsairEntities)
          .where(
            and(
              eq(corsairEntities.accountId, accountId),
              eq(corsairEntities.entityId, msg.id),
              eq(corsairEntities.entityType, "messages")
            )
          )
          .limit(1);

        if (existing.length > 0) {
          await ctx.db
            .update(corsairEntities)
            .set({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              data: fullMsg,
              updatedAt: new Date(),
              version,
            })
            .where(
              and(
                eq(corsairEntities.accountId, accountId),
                eq(corsairEntities.entityId, msg.id),
                eq(corsairEntities.entityType, "messages")
              )
            );
        } else {
          await ctx.db.insert(corsairEntities).values({
            id: randomUUID(),
            accountId,
            entityId: msg.id,
            entityType: "messages",
            version,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data: fullMsg,
          });
          synced++;
        }
      } catch (err) {
        // Log but don't fail the whole refresh for one bad message
        console.error(`[refreshInbox] failed to sync message ${msg.id}:`, err);
      }
    }

    return { synced, total: messageIds.length };
  }),

  sendEmail: protectedProcedure
    .input(
      z.object({
        to: z.string().min(1, "Recipient is required"),
        cc: z.string().optional(),
        bcc: z.string().optional(),
        subject: z.string().min(1, "Subject is required"),
        body: z.string(),
        isHtml: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const client = corsair.withTenant(tenantId);

      // Build RFC 2822 email message
      const contentType = input.isHtml ? "text/html" : "text/plain";
      const lines: string[] = [
        `To: ${input.to}`,
        ...(input.cc ? [`Cc: ${input.cc}`] : []),
        ...(input.bcc ? [`Bcc: ${input.bcc}`] : []),
        `Subject: ${input.subject}`,
        `Content-Type: ${contentType}; charset=UTF-8`,
        `MIME-Version: 1.0`,
        ``,
        input.body,
      ];
      const raw = lines.join("\r\n");

      // Base64url encode (required by Gmail API)
      const encoded = Buffer.from(raw)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      // Send via Corsair Gmail client
      const result = await client.gmail.api.messages.send({
        raw: encoded,
      }) as { id?: string } | null;

      if (result?.id) {
        await ctx.db.insert(sentMail).values({
          id: randomUUID(),
          tenantId,
          to: input.to,
          cc: input.cc ?? null,
          bcc: input.bcc ?? null,
          subject: input.subject,
          body: input.body,
          messageId: result.id,
        });
      }

      return { messageId: result?.id ?? null };
    }),

  getSentEmails: protectedProcedure
    .query(async ({ ctx }) => {
      const tenantId = ctx.session.user.id;
      
      const emails = await ctx.db
        .select()
        .from(sentMail)
        .where(eq(sentMail.tenantId, tenantId))
        .orderBy(desc(sentMail.createdAt));
        
      return emails;
    }),
});