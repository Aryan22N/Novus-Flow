import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { eq, desc, sql, and } from "drizzle-orm";
import { corsairEntities, corsairAccounts } from "~/server/db/corsair-schema";
import { TRPCError } from "@trpc/server";
import { getAiProvider } from "./ai-provider";
import { loadUserContext, buildContextPrompt } from "./ai-context";
import {
  getHeader,
  extractSender,
  parsePayload,
  type Attachment,
} from "~/server/utils/email-parsing";

interface ThreadMessage {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  to?: string;
  cc?: string;
  subject: string;
  snippet: string;
  htmlBody: string;
  plainBody: string;
  attachments: Attachment[];
  unread: boolean;
  date: Date;
}

async function fetchThreadMessages(
  ctx: any,
  threadId: string,
  tenantId: string,
): Promise<ThreadMessage[]> {
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
      sql`${corsairEntities.entityType} = 'messages' AND ${corsairEntities.data}->>'threadId' = ${threadId}`,
    )
    .orderBy(desc(corsairEntities.createdAt));

  const seenIds = new Set<string>();
  const dedupedResult = messagesResult.filter(({ entity }: any) => {
    if (seenIds.has(entity.entityId)) return false;
    seenIds.add(entity.entityId);
    return true;
  });

  const messages: ThreadMessage[] = dedupedResult.map(
    ({ entity: message }: any) => {
      const data = message.data as any;
      const headers = data?.payload?.headers ?? [];

      const from = getHeader(headers, "From");
      const to = getHeader(headers, "To");
      const cc = getHeader(headers, "Cc");
      const subject =
        data.subject ?? getHeader(headers, "Subject") ?? "(no subject)";

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
              : data.createdAt || Date.now(),
        ),
      };
    },
  );

  messages.reverse();
  return messages;
}

export const aiRouter = createTRPCRouter({
  analyzeThread: publicProcedure
    .input(z.object({ threadId: z.string().nullish() }).optional())
    .query(async ({ ctx, input }) => {
      if (!input?.threadId || !ctx.session?.user) {
        return null;
      }
      const tenantId = ctx.session.user.id;
      const messages = await fetchThreadMessages(ctx, input.threadId, tenantId);

      if (messages.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread messages not found or empty.",
        });
      }

      const threadText = messages
        .map(
          (m: ThreadMessage) =>
            `From: ${m.sender} <${m.senderEmail}>\nSubject: ${m.subject}\nSnippet: ${m.snippet}\nContent:\n${m.plainBody || m.snippet}`,
        )
        .join("\n\n---\n\n");

      try {
        const userCtx       = await loadUserContext(tenantId);
        const contextPrompt = buildContextPrompt(userCtx);
        const contextStr    = `User Name: ${ctx.session.user.name ?? "User"}\nUser Email: ${ctx.session.user.email ?? ""}\n${contextPrompt}`;

        const provider = getAiProvider();
        const result = await provider.analyzeThread(threadText, contextStr);
        return result;
      } catch (error: any) {
        console.error("AI analysis failed:", error);
        const isRateLimit =
          error.message?.includes("429") ||
          error.message?.toLowerCase().includes("quota") ||
          error.message?.toLowerCase().includes("rate limit");
        throw new TRPCError({
          code: isRateLimit ? "TOO_MANY_REQUESTS" : "INTERNAL_SERVER_ERROR",
          message: isRateLimit
            ? "AI rate limit or quota exceeded. Please wait a moment before trying again, or switch model providers in your config."
            : `Failed to analyze thread with AI: ${error.message || "Unknown error"}.`,
        });
      }
    }),

  generateReplyDraft: protectedProcedure
    .input(z.object({
      threadId: z.string(),
      userBriefPrompt: z.string(),
      recipientEmail: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      const messages = await fetchThreadMessages(ctx, input.threadId, tenantId);

      if (messages.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread messages not found or empty.",
        });
      }

      const threadText = messages
        .map(
          (m: ThreadMessage) =>
            `From: ${m.sender} <${m.senderEmail}>\nSubject: ${m.subject}\nSnippet: ${m.snippet}\nContent:\n${m.plainBody || m.snippet}`,
        )
        .join("\n\n---\n\n");

      try {
        const userCtx       = await loadUserContext(tenantId);
        const contextPrompt = buildContextPrompt(userCtx, input.recipientEmail);
        const contextStr    = `User Name: ${ctx.session.user.name ?? "User"}\nUser Email: ${ctx.session.user.email ?? ""}\n${contextPrompt}`;

        const provider = getAiProvider();
        const result = await provider.generateReplyDraft(
          threadText,
          input.userBriefPrompt,
          contextStr
        );
        return result;
      } catch (error: any) {
        console.error("AI reply draft generation failed:", error);
        const isRateLimit =
          error.message?.includes("429") ||
          error.message?.toLowerCase().includes("quota") ||
          error.message?.toLowerCase().includes("rate limit");
        throw new TRPCError({
          code: isRateLimit ? "TOO_MANY_REQUESTS" : "INTERNAL_SERVER_ERROR",
          message: isRateLimit
            ? "AI rate limit or quota exceeded. Please wait a moment before trying again."
            : `Failed to generate reply draft with AI: ${error.message || "Unknown error"}.`,
        });
      }
    }),

  generateGlobalDraft: protectedProcedure
    .input(z.object({
      prompt: z.string(),
      recipientEmail: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.id;
      try {
        const userCtx       = await loadUserContext(tenantId);
        const contextPrompt = buildContextPrompt(userCtx, input.recipientEmail);
        const contextStr    = `User Name: ${ctx.session.user.name ?? "User"}\nUser Email: ${ctx.session.user.email ?? ""}\n${contextPrompt}`;

        const provider = getAiProvider();
        const result = await provider.generateGlobalDraft(input.prompt, contextStr);
        return result;
      } catch (error: any) {
        console.error("AI global draft generation failed:", error);
        const isRateLimit =
          error.message?.includes("429") ||
          error.message?.toLowerCase().includes("quota") ||
          error.message?.toLowerCase().includes("rate limit");
        throw new TRPCError({
          code: isRateLimit ? "TOO_MANY_REQUESTS" : "INTERNAL_SERVER_ERROR",
          message: isRateLimit
            ? "AI rate limit or quota exceeded. Please wait a moment before trying again."
            : `Failed to generate global draft with AI: ${error.message || "Unknown error"}.`,
        });
      }
    }),

  summarizeRecentEmails: protectedProcedure.mutation(async ({ ctx }) => {
    const tenantId = ctx.session.user.id;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

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
      .where(eq(corsairEntities.entityType, "messages"));

    const recentUnreadEmails = messages
      .filter(({ entity: message }) => {
        const data = message.data as any;
        if (!data?.payload) return false;
        if (!data.labelIds?.includes("UNREAD")) return false;

        const headers = data.payload.headers ?? [];
        const dateHeader = getHeader(headers, "Date");
        const headerTimestamp = dateHeader
          ? new Date(dateHeader).getTime()
          : NaN;

        const date = new Date(
          data.internalDate
            ? Number(data.internalDate)
            : !Number.isNaN(headerTimestamp)
              ? headerTimestamp
              : data.createdAt || Date.now(),
        );

        return date.getTime() >= yesterday.getTime();
      })
      .sort((a, b) => {
        const dataA = a.entity.data as any;
        const dataB = b.entity.data as any;
        return (dataB.internalDate || 0) - (dataA.internalDate || 0);
      });

    if (recentUnreadEmails.length === 0) {
      return {
        updates: ["No recent unread emails from the last 24 hours."],
        tasks: [],
        meetings: [],
        deadlines: [],
      };
    }

    const emailsText = recentUnreadEmails
      .map(({ entity: message }) => {
        const data = message.data as any;
        const headers = data.payload.headers ?? [];
        const from = getHeader(headers, "From");
        const subject = getHeader(headers, "Subject") ?? "(no subject)";
        const snippet = data.snippet ?? "";
        return `From: ${from}\nSubject: ${subject}\nSnippet: ${snippet}`;
      })
      .join("\n\n---\n\n");

    try {
      const userCtx       = await loadUserContext(tenantId);
      const contextPrompt = buildContextPrompt(userCtx);
      const contextStr    = `User Name: ${ctx.session.user.name ?? "User"}\nUser Email: ${ctx.session.user.email ?? ""}\n${contextPrompt}`;

      const provider = getAiProvider();
      const result = await provider.summarizeRecentEmails(emailsText, contextStr);
      return result;
    } catch (error: any) {
      console.error("AI summary generation failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to summarize emails with AI: ${error.message || "Unknown error"}.`,
      });
    }
  }),

  getSuggestedReplies: publicProcedure
    .input(z.object({ threadId: z.string(), messageId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        return [
          "Thank you for the email. I have reviewed my activity.",
          "It was me, thanks for checking.",
          "I don't recognize this device. What are the next steps?",
        ];
      }
      const tenantId = ctx.session.user.id;
      const messages = await fetchThreadMessages(ctx, input.threadId, tenantId);
      const targetMsgIndex = messages.findIndex(
        (m) => m.id === input.messageId,
      );
      if (targetMsgIndex === -1) {
        return [
          "Thank you for the email. I have reviewed my activity.",
          "It was me, thanks for checking.",
          "I don't recognize this device. What are the next steps?",
        ];
      }

      // Get message sequence up to the target message
      const contextMessages = messages.slice(0, targetMsgIndex + 1);
      const threadText = contextMessages
        .map(
          (m: ThreadMessage) =>
            `From: ${m.sender} <${m.senderEmail}>\nSubject: ${m.subject}\nSnippet: ${m.snippet}\nContent:\n${m.plainBody || m.snippet}`,
        )
        .join("\n\n---\n\n");

      try {
        const provider = getAiProvider();
        const result = await provider.generateSuggestions(threadText);
        return result.suggestions;
      } catch (error) {
        console.error("AI suggested replies generation failed:", error);
        return [
          "Thank you for the email. I have reviewed my activity.",
          "It was me, thanks for checking.",
          "I don't recognize this device. What are the next steps?",
        ];
      }
    }),
});
