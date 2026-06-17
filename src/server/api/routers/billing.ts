import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getPlan, PLAN_LIMITS } from "~/server/ai/check-limit";
import { redis } from "~/server/redis";

export const billingRouter = createTRPCRouter({
  getPlanAndUsage: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const plan = await getPlan(userId);
    const limits = PLAN_LIMITS[plan];

    const dateStr = new Date().toISOString().split("T")[0];
    const aiRequestUsageKey = `usage:${userId}:ai_request:${dateStr}`;
    const summaryUsageKey = `usage:${userId}:summary:${dateStr}`;

    const [aiRequestsStr, summariesStr] = await Promise.all([
      redis.get<number>(aiRequestUsageKey),
      redis.get<number>(summaryUsageKey),
    ]);

    const aiRequests = aiRequestsStr || 0;
    const summaries = summariesStr || 0;

    return {
      plan,
      limits: {
        aiRequests: limits.ai_request,
        summaries: limits.summary,
        voice: limits.voice,
      },
      usage: {
        aiRequests,
        summaries,
      },
      remaining: {
        aiRequests: limits.ai_request === Infinity ? Infinity : Math.max(0, limits.ai_request - aiRequests),
        summaries: limits.summary === Infinity ? Infinity : Math.max(0, limits.summary - summaries),
      },
    };
  }),
});
