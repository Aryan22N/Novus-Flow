/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { eq, desc, sql, and, ilike, or, inArray } from "drizzle-orm";
import { corsairEntities, corsairAccounts } from "~/server/db/corsair-schema";
import { sentMail, draftMail, aiCorrections, contacts } from "~/server/db/schema";
import { corsair } from "~/server/corsair";
import { randomUUID } from "crypto";
import {
  getHeader,
  extractSender,
  parsePayload,
  getEmailCategory,
} from "~/server/utils/email-parsing";
import { db } from "~/server/db";
import { invalidateUserContext } from "./ai-context";
import { upsertContactsForEmail } from "~/server/utils/contacts";
import { ensureThreadSynced } from "~/server/utils/thread-sync";

export const emailRouter = createTRPCRouter({
  getInboxThreads: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        category: z.string().optional(),
        isStarred: z.boolean().optional(),
        unreadOnly: z.boolean().optional(),
      }),
    )
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
            eq(corsairAccounts.tenantId, tenantId),
          ),
        )
        .where(
          and(
            eq(corsairEntities.entityType, "messages"),
            eq(corsairEntities.isArchived, false),
            eq(corsairEntities.isDeleted, false),
          ),
        );

      // Deduplicate by Gmail message ID in case of multiple accounts for the same tenant
      const seen = new Set<string>();

      const allEmails = messages
        .filter(({ entity: message }) => {
          const data = message.data as any;
          return !!data?.payload;
        })
        .map(({ entity: message }) => {
          const data = message.data as any;

          const headers = data?.payload?.headers ?? [];

          const from = getHeader(headers, "From");

          const dateHeader = getHeader(headers, "Date");
          const headerTimestamp = dateHeader
            ? new Date(dateHeader).getTime()
            : NaN;

          return {
            id: message.entityId,
            threadId: data.threadId,

            sender: extractSender(from),

            senderEmail: from?.match(/<(.+?)>/)?.[1] ?? from,

            subject: getHeader(headers, "Subject") ?? "(no subject)",

            snippet: data.snippet ?? "",

            unread: !message.isRead,

            isStarred: data.labelIds?.includes("STARRED"),

            category: getEmailCategory(data.labelIds),

            date: new Date(
              data.internalDate
                ? Number(data.internalDate)
                : !Number.isNaN(headerTimestamp)
                  ? headerTimestamp
                  : data.createdAt || Date.now(),
            ),
          };
        })
        .filter((email) => {
          if (seen.has(email.id)) return false;
          if (input.category && email.category !== input.category) return false;
          if (input.isStarred && !email.isStarred) return false;
          if (input.unreadOnly && !email.unread) return false;
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

  searchEmails: protectedProcedure
    .input(
      z.object({
        query: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const searchTerms = `%${input.query}%`;

      const messages = await ctx.db
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
          and(
            eq(corsairEntities.entityType, "messages"),
            eq(corsairEntities.isArchived, false),
            eq(corsairEntities.isDeleted, false),
            or(
              ilike(sql`${corsairEntities.data}->>'subject'`, searchTerms),
              ilike(sql`${corsairEntities.data}->>'snippet'`, searchTerms),
              ilike(sql`${corsairEntities.data}::text`, searchTerms)
            )
          )
        )
        .orderBy(desc(corsairEntities.createdAt))
        .limit(200);

      // Deduplicate by Gmail thread ID
      const seen = new Set<string>();

      const allEmails = messages
        .filter(({ entity: message }) => {
          const data = message.data as any;
          return !!data?.payload;
        })
        .map(({ entity: message }) => {
          const data = message.data as any;

          const headers = data?.payload?.headers ?? [];

          const from = getHeader(headers, "From");

          const dateHeader = getHeader(headers, "Date");
          const headerTimestamp = dateHeader
            ? new Date(dateHeader).getTime()
            : NaN;

          return {
            id: message.entityId,
            threadId: data.threadId || message.entityId,

            sender: extractSender(from),

            senderEmail: from?.match(/<(.+?)>/)?.[1] ?? from,

            subject: getHeader(headers, "Subject") ?? "(no subject)",

            snippet: data.snippet ?? "",

            unread: !message.isRead,

            isStarred: data.labelIds?.includes("STARRED"),

            category: getEmailCategory(data.labelIds),

            date: new Date(
              data.internalDate
                ? Number(data.internalDate)
                : !Number.isNaN(headerTimestamp)
                  ? headerTimestamp
                  : data.createdAt || Date.now(),
            ),
          };
        })
        .filter((email) => {
          if (seen.has(email.threadId)) return false;
          seen.add(email.threadId);
          return true;
        })
        .slice(0, 50);

      return {
        emails: allEmails,
        total: allEmails.length,
        page: 1,
        pageSize: 50,
        pageCount: 1,
      };
    }),

  getUnreadCounts: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.session.user.id;
    const messages = await ctx.db
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
        and(
          eq(corsairEntities.entityType, "messages"),
          eq(corsairEntities.isArchived, false),
          eq(corsairEntities.isDeleted, false),
        ),
      );

    const counts = {
      primary: 0,
      promotions: 0,
      socials: 0,
      updates: 0,
      meetings: 0,
    };

    const seen = new Set<string>();

    for (const { entity } of messages) {
      const data = entity.data as any;
      if (!data?.payload) continue;
      if (entity.isRead) continue;
      if (seen.has(entity.entityId)) continue;
      seen.add(entity.entityId);

      const labelIds = data.labelIds as string[];
      const cat = getEmailCategory(labelIds);

      counts[cat as keyof typeof counts]++;
    }

    return counts;
  }),

  toggleStar: protectedProcedure
    .input(z.object({ messageId: z.string(), isStarred: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const client = corsair.withTenant(tenantId) as any;

      try {
        // 1. Update in Gmail
        await client.gmail!.api!.messages!.modify({
          id: input.messageId,
          addLabelIds: input.isStarred ? ["STARRED"] : [],
          removeLabelIds: input.isStarred ? [] : ["STARRED"],
        });

        // 2. Update local DB cache so UI reflects immediately without a full sync
        const messageRows = await ctx.db
          .select({ entity: corsairEntities, id: corsairEntities.id })
          .from(corsairEntities)
          .innerJoin(
            corsairAccounts,
            and(
              eq(corsairEntities.accountId, corsairAccounts.id),
              eq(corsairAccounts.tenantId, tenantId),
            ),
          )
          .where(
            and(
              eq(corsairEntities.entityType, "messages"),
              eq(corsairEntities.entityId, input.messageId),
            ),
          )
          .limit(1);

        if (messageRows.length > 0) {
          const row = messageRows[0]!;
          const data = row.entity.data as any;
          let labelIds = data.labelIds as string[] | undefined;
          if (!labelIds) labelIds = [];

          if (input.isStarred && !labelIds.includes("STARRED")) {
            labelIds.push("STARRED");
          } else if (!input.isStarred) {
            labelIds = labelIds.filter((l) => l !== "STARRED");
          }

          data.labelIds = labelIds;

          await ctx.db
            .update(corsairEntities)
            .set({ data })
            .where(eq(corsairEntities.id, row.id));
        }

        return { success: true };
      } catch (error) {
        console.error("Failed to toggle star:", error);
        throw new Error("Failed to toggle star");
      }
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
          eq(corsairAccounts.tenantId, tenantId),
        ),
      )
      .where(
        and(
          eq(corsairEntities.entityType, "messages"),
          eq(corsairEntities.isArchived, false),
          eq(corsairEntities.isDeleted, false),
        ),
      );

    const seen = new Set<string>();
    const unreadCount = messages.filter(({ entity: message }) => {
      if (seen.has(message.entityId)) return false;
      seen.add(message.entityId);
      return !message.isRead;
    }).length;

    return { count: unreadCount };
  }),

  markThreadAsRead: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const client = corsair.withTenant(tenantId) as any;

      // Get all message entities belonging to this thread and tenant
      const messages = await ctx.db
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
          sql`${corsairEntities.entityType} = 'messages' AND ${corsairEntities.data}->>'threadId' = ${input.threadId}`,
        );

      // Modify the thread labels in Gmail (batch remove UNREAD label)
      const messageIds = messages
        .map(({ entity: msg }) => msg.entityId)
        .filter(Boolean);

      if (messageIds.length > 0) {
        try {
          await client.gmail!.api!.messages!.batchModify({
            ids: messageIds,
            removeLabelIds: ["UNREAD"],
          });
        } catch (err) {
          console.error(
            `Failed to remove UNREAD label from messages in Gmail:`,
            err,
          );
        }
      }

      // Update local DB cache so that getUnreadCount reflects this immediately
      for (const { entity: msg } of messages) {
        const data = msg.data as any;
        if (data?.labelIds?.includes("UNREAD")) {
          const updatedLabelIds = (data.labelIds as string[]).filter(
            (label) => label !== "UNREAD",
          );
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

      await ensureThreadSynced(ctx, input.threadId, tenantId);

      const messagesResult = await ctx.db
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
          sql`${corsairEntities.entityType} = 'messages' AND ${corsairEntities.data}->>'threadId' = ${input.threadId}`,
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
        const subject =
          data.subject ?? getHeader(headers, "Subject") ?? "(no subject)";

        const { htmlBody, plainBody, attachments } = parsePayload(data.payload);

        const dateHeader = getHeader(headers, "Date");
        const headerTimestamp = dateHeader
          ? new Date(dateHeader).getTime()
          : NaN;

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
                : data.createdAt || Date.now(),
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
    const client = corsair.withTenant(tenantId) as any;

    // Fetch the latest 50 INBOX messages
    const listResult = (await client.gmail!.api!.messages!.list({
      maxResults: 50,
      labelIds: ["INBOX"],
    })) as { messages?: { id: string }[] } | null;

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
        const fullMsg = (await client.gmail!.api!.messages!.get({
          id: msg.id,
          format: "full",
        })) as any;

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
              eq(corsairEntities.entityType, "messages"),
            ),
          )
          .limit(1);
        if (existing.length > 0) {
          await ctx.db
            .update(corsairEntities)
            .set({
              data: fullMsg,
              updatedAt: new Date(),
              version,
              isRead: !(fullMsg.labelIds?.includes("UNREAD")),
            })
            .where(
              and(
                eq(corsairEntities.accountId, accountId),
                eq(corsairEntities.entityId, msg.id),
                eq(corsairEntities.entityType, "messages"),
              ),
            );
        } else {
          await ctx.db.insert(corsairEntities).values({
            id: randomUUID(),
            accountId,
            entityId: msg.id,
            entityType: "messages",
            version,
            data: fullMsg,
            isRead: !(fullMsg.labelIds?.includes("UNREAD")),
          });
          synced++;

          // Upsert contacts for newly synced received email
          const headers = (fullMsg.payload?.headers ?? []) as { name: string; value: string }[];
          const fromHeader = getHeader(headers, "From");
          const toHeader = getHeader(headers, "To");
          const ccHeader = getHeader(headers, "Cc");
          const dateHeader = getHeader(headers, "Date");
          const emailDate = dateHeader ? new Date(dateHeader) : new Date();

          void upsertContactsForEmail({
            db: ctx.db,
            userId: tenantId,
            userEmail: ctx.session.user.email,
            from: fromHeader,
            to: toHeader,
            cc: ccHeader,
            date: emailDate,
          }).catch((err) =>
            console.error(`[refreshInbox] upsertContactsForEmail failed:`, err),
          );
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
        aiDraftText: z.string().optional(),
        threadId: z.string().optional(),
        attachments: z.array(z.object({
          name: z.string(),
          url: z.string()
        })).optional()
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const client = corsair.withTenant(tenantId) as any;

      let raw: string;
      const hasAttachments = input.attachments && input.attachments.length > 0;
      const contentType = input.isHtml ? "text/html" : "text/plain";

      if (hasAttachments) {
        const boundary = "====Boundary_XYZ====";
        const lines: string[] = [
          `To: ${input.to}`,
          ...(input.cc ? [`Cc: ${input.cc}`] : []),
          ...(input.bcc ? [`Bcc: ${input.bcc}`] : []),
          `Subject: ${input.subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          ``,
          `--${boundary}`,
          `Content-Type: ${contentType}; charset=UTF-8`,
          ``,
          input.body,
        ];
        
        for (const attachment of input.attachments!) {
           try {
             const res = await fetch(attachment.url);
             const arrayBuffer = await res.arrayBuffer();
             const base64Content = Buffer.from(arrayBuffer).toString('base64');
             
             lines.push(
               ``,
               `--${boundary}`,
               `Content-Type: application/octet-stream; name="${attachment.name}"`,
               `Content-Disposition: attachment; filename="${attachment.name}"`,
               `Content-Transfer-Encoding: base64`,
               ``,
               ...(base64Content.match(/.{1,76}/g) || [base64Content])
             );
           } catch(e) {
             console.error(`Failed to fetch attachment ${attachment.name}:`, e);
           }
        }
        lines.push(``, `--${boundary}--`);
        raw = lines.join("\r\n");
      } else {
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
        raw = lines.join("\r\n");
      }

      // Base64url encode (required by Gmail API)
      const encoded = Buffer.from(raw)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      // Send via Corsair Gmail client
      const result = (await client.gmail!.api!.messages!.send({
        raw: encoded,
      })) as { id?: string } | null;

      const messageId = result?.id ?? null;

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

        // Upsert contacts for successfully sent email
        void upsertContactsForEmail({
          db: ctx.db,
          userId: tenantId,
          userEmail: ctx.session.user.email,
          from: ctx.session.user.email,
          to: input.to,
          cc: input.cc ?? undefined,
          date: new Date(),
        }).catch((err) =>
          console.error(`[sendEmail] upsertContactsForEmail failed:`, err),
        );
      }

      // NEW: async correction capture — never blocks the email send
      if (
        input.aiDraftText &&
        input.aiDraftText.trim() !== input.body.trim()
      ) {
        void captureCorrection({
          userId: tenantId,
          aiDraftText: input.aiDraftText,
          userEditedText: input.body,
          recipientEmail: input.to,
          emailSubject: input.subject,
          threadId: input.threadId,
        }).catch((err) =>
          console.error("[sendEmail] captureCorrection failed:", err),
        );
      }

      return { messageId };
    }),

  getSentEmails: protectedProcedure
    .query(async ({ ctx }) => {
      const tenantId = ctx.session.user.id;
      const client = corsair.withTenant(tenantId) as any;
      
      try {
        const listResult = (await client.gmail!.api!.messages!.list({
          maxResults: 20,
          labelIds: ["SENT"],
        })) as { messages?: { id: string }[] } | null;

        const messageIds = listResult?.messages ?? [];
        
        if (messageIds.length > 0) {
          const emailsToCache = await Promise.all(
            messageIds.map(async (msg) => {
              const fullMsg = (await client.gmail!.api!.messages!.get({
                id: msg.id,
                format: "full",
              })) as any;
              
              const headers = fullMsg.payload?.headers ?? [];
              const to = getHeader(headers, "To") || "Unknown";
              const subject = getHeader(headers, "Subject") || "(no subject)";
              const dateHeader = getHeader(headers, "Date");
              const date = dateHeader ? new Date(dateHeader) : new Date(Number(fullMsg.internalDate || Date.now()));
              
              return {
                id: fullMsg.id as string,
                tenantId,
                to: extractSender(to),
                cc: null,
                bcc: null,
                subject: subject as string,
                body: (fullMsg.snippet as string) || "",
                messageId: fullMsg.id as string,
                createdAt: date,
              };
            })
          );
          
          await ctx.db
            .insert(sentMail)
            .values(emailsToCache)
            .onConflictDoNothing();
        }
      } catch (error) {
        console.error("Failed to sync sent emails from Gmail:", error);
      }

      // Always return from DB cache
      const localSent = await ctx.db
        .select()
        .from(sentMail)
        .where(eq(sentMail.tenantId, tenantId))
        .orderBy(desc(sentMail.createdAt))
        .limit(50);
        
      return localSent.map(({ tenantId, ...rest }) => rest);
    }),

  saveDraft: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        to: z.string().optional(),
        cc: z.string().optional(),
        bcc: z.string().optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const draftId = input.id ?? randomUUID();

      const existing = await ctx.db
        .select({ id: draftMail.id })
        .from(draftMail)
        .where(eq(draftMail.id, draftId))
        .limit(1);

      if (existing.length > 0) {
        await ctx.db
          .update(draftMail)
          .set({
            to: input.to ?? "",
            cc: input.cc ?? "",
            bcc: input.bcc ?? "",
            subject: input.subject ?? "",
            body: input.body ?? "",
            updatedAt: new Date(),
          })
          .where(eq(draftMail.id, draftId));
      } else {
        await ctx.db.insert(draftMail).values({
          id: draftId,
          tenantId,
          to: input.to ?? "",
          cc: input.cc ?? "",
          bcc: input.bcc ?? "",
          subject: input.subject ?? "",
          body: input.body ?? "",
        });
      }

      return { draftId };
    }),

  getDraftsCount: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.session.user.id;
    const drafts = await ctx.db
      .select({ id: draftMail.id })
      .from(draftMail)
      .where(eq(draftMail.tenantId, tenantId));
    
    return { count: drafts.length };
  }),

  getDrafts: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.session.user.id;
    const drafts = await ctx.db
      .select()
      .from(draftMail)
      .where(eq(draftMail.tenantId, tenantId))
      .orderBy(desc(draftMail.updatedAt));
    return drafts.map(({ tenantId, ...rest }) => rest);
  }),

  deleteDraft: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(draftMail)
        .where(eq(draftMail.id, input.id));
      return { success: true };
    }),

  deleteDrafts: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      if (input.ids.length === 0) return { success: true };
      await ctx.db
        .delete(draftMail)
        .where(inArray(draftMail.id, input.ids));
      return { success: true };
    }),

  searchContacts: protectedProcedure
    .input(z.object({ query: z.string().default("") }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const cleanQuery = input.query.trim().toLowerCase();
      const q = cleanQuery ? `%${cleanQuery}%` : undefined;

      const results = await ctx.db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, tenantId),
            q
              ? or(
                  sql`lower(coalesce(${contacts.name}, '')) like ${q}`,
                  ilike(contacts.email, q),
                )
              : undefined,
          ),
        )
        .orderBy(desc(contacts.interactionCount), desc(contacts.lastContactedAt))
        .limit(5);

      return results.map(({ userId, ...rest }) => rest);
    }),

  archiveEmails: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const client = corsair.withTenant(tenantId) as any;

      // 1. Update in Gmail (remove INBOX label)
      try {
        await client.gmail!.api!.messages!.batchModify({
          ids: input.ids,
          removeLabelIds: ["INBOX"],
        });
      } catch (err) {
        console.error("Gmail batchModify remove INBOX failed:", err);
      }

      // 2. Update local DB cache
      await ctx.db
        .update(corsairEntities)
        .set({
          isArchived: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(corsairEntities.entityType, "messages"),
            inArray(corsairEntities.entityId, input.ids),
          ),
        );

      return { success: true };
    }),

  deleteEmails: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const client = corsair.withTenant(tenantId) as any;

      // 1. Update in Gmail (trash them)
      try {
        await client.gmail!.api!.messages!.batchModify({
          ids: input.ids,
          addLabelIds: ["TRASH"],
        });
      } catch (err) {
        console.error("Gmail batchModify add TRASH failed:", err);
      }

      // 2. Update local DB cache (soft delete)
      await ctx.db
        .update(corsairEntities)
        .set({
          isDeleted: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(corsairEntities.entityType, "messages"),
            inArray(corsairEntities.entityId, input.ids),
          ),
        );

      return { success: true };
    }),

  markEmailsReadStatus: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        isRead: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const client = corsair.withTenant(tenantId) as any;

      // 1. Update in Gmail (add/remove UNREAD label)
      try {
        await client.gmail!.api!.messages!.batchModify({
          ids: input.ids,
          addLabelIds: input.isRead ? [] : ["UNREAD"],
          removeLabelIds: input.isRead ? ["UNREAD"] : [],
        });
      } catch (err) {
        console.error("Gmail batchModify read status failed:", err);
      }

      // 2. Update local DB cache
      await ctx.db
        .update(corsairEntities)
        .set({
          isRead: input.isRead,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(corsairEntities.entityType, "messages"),
            inArray(corsairEntities.entityId, input.ids),
          ),
        );

      return { success: true };
    }),

  /**
   * Registers a Gmail push-notification watch channel so that Google calls
   * our /api/webhooks endpoint whenever the inbox changes.
   */
  registerWebhook: protectedProcedure.mutation(async ({ ctx }) => {
    const tenantId = ctx.session.user.id;
    const client = corsair.withTenant(tenantId) as any;
    
    const topicName = process.env.GMAIL_PUBSUB_TOPIC;
    
    if (!topicName) {
      console.info("[email.registerWebhook] Skipping — GMAIL_PUBSUB_TOPIC is not set.");
      return { success: false as const, reason: "no_topic_configured" };
    }

    try {
      const res = await client.gmail!.api!.users!.watch({
        userId: "me",
        requestBody: {
          topicName: topicName,
          labelIds: ["INBOX"],
        },
      });

      console.info(
        `[email.registerWebhook] Watch registered: historyId=${res?.historyId} expiration=${res?.expiration}`
      );

      return {
        success: true as const,
        historyId: res?.historyId,
        expiration: res?.expiration,
      };
    } catch (err) {
      console.warn("[email.registerWebhook] Google rejected the watch request:", err);
      return {
        success: false as const,
        reason: err instanceof Error ? err.message : "unknown",
      };
    }
  }),


});

async function captureCorrection(data: {
  userId:         string;
  aiDraftText:    string;
  userEditedText: string;
  recipientEmail?: string;
  emailSubject?:   string;
  threadId?:       string;
}): Promise<void> {
  await db.insert(aiCorrections).values({
    userId:          data.userId,
    aiDraftText:     data.aiDraftText,
    userEditedText:  data.userEditedText,
    recipientEmail:  data.recipientEmail,
    emailSubject:    data.emailSubject,
    threadId:        data.threadId,
    correctionType:  classifyCorrection(data.aiDraftText, data.userEditedText),
  });

  // Bust Redis cache so next AI call picks up this correction immediately
  await invalidateUserContext(data.userId);
}

function classifyCorrection(original: string, edited: string): string {
  const origWords = original.trim().split(/\s+/).length;
  const editWords = edited.trim().split(/\s+/).length;
  const lenDiff   = Math.abs(editWords - origWords);

  // Length changed significantly
  if (lenDiff > 30 || lenDiff / origWords > 0.4) return "length";

  // Tone markers added or removed
  const formalMarkers   = ["regards", "sincerely", "dear", "pleased", "kindly"];
  const casualMarkers   = ["hey", "thanks!", "cheers", "hi!", "sounds good"];
  const addedFormal   = formalMarkers.some(m => !original.toLowerCase().includes(m) && edited.toLowerCase().includes(m));
  const addedCasual   = casualMarkers.some(m => !original.toLowerCase().includes(m) && edited.toLowerCase().includes(m));
  if (addedFormal || addedCasual) return "tone";

  // Default — wording changed but length and tone similar
  return "phrasing";
}
