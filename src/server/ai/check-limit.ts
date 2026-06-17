import { TRPCError } from "@trpc/server";
import { redis } from "../redis";
import { db } from "../db";
import { subscriptions } from "../db/schema";
import { eq } from "drizzle-orm";

export type AIFeature = "ai_request" | "summary";

export const PLAN_LIMITS = {
  free: {
    ai_request: 5,
    summary: 3,
    voice: false,
  },
  pro: {
    ai_request: Infinity,
    summary: Infinity,
    voice: true,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export async function getPlan(userId: string): Promise<PlanType> {
  const cacheKey = `plan:${userId}`;
  const cachedPlan = await redis.get<string>(cacheKey);

  if (cachedPlan === "free" || cachedPlan === "pro") {
    return cachedPlan as PlanType;
  }

  // Fallback to DB
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  const plan = sub?.plan === "pro" ? "pro" : "free";

  // Cache for 1 day
  await redis.set(cacheKey, plan, { ex: 60 * 60 * 24 });

  return plan;
}

function getUsageKey(userId: string, feature: AIFeature): string {
  // Use local date string YYYY-MM-DD
  const dateStr = new Date().toISOString().split("T")[0];
  return `usage:${userId}:${feature}:${dateStr}`;
}

export async function checkLimit(userId: string, feature: AIFeature) {
  const plan = await getPlan(userId);
  const limits = PLAN_LIMITS[plan];

  const usageKey = getUsageKey(userId, feature);
  const currentUsage = await redis.get<number>(usageKey) || 0;

  if (currentUsage >= limits[feature]) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Daily limit reached for ${feature}. Please upgrade your plan.`,
    });
  }
}

export async function incrementUsage(userId: string, feature: AIFeature) {
  const plan = await getPlan(userId);
  if (plan === "pro") return; // No need to increment for pro users to save redis calls

  const usageKey = getUsageKey(userId, feature);
  
  // Calculate seconds until midnight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const secondsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);

  const pipeline = redis.pipeline();
  pipeline.incr(usageKey);
  pipeline.expire(usageKey, secondsUntilMidnight);
  await pipeline.exec();
}
