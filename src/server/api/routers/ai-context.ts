import { redis } from "~/server/redis";
import { db } from "~/server/db";
import {
  userWritingProfiles,
  aiCorrections,
  recipientPatterns,
} from "~/server/db/schema";
import { eq, desc, isNull, and } from "drizzle-orm";

// Shape of what we store in Redis and pass around
export type UserContext = {
  profile:     typeof userWritingProfiles.$inferSelect | null;
  corrections: (typeof aiCorrections.$inferSelect)[];
  patterns:    (typeof recipientPatterns.$inferSelect)[];
};

const CACHE_TTL_SECONDS = 3600; // 1 hour

export async function loadUserContext(userId: string): Promise<UserContext> {
  const cacheKey = `ctx:${userId}`;

  // 1. Try Redis first — sub-millisecond when warm
  try {
    const cached = await redis.get<UserContext>(cacheKey);
    if (cached) return cached;
  } catch (err) {
    // Redis down → fall through to DB, never crash
    console.warn("[ai-context] Redis get failed, falling back to DB:", err);
  }

  // 2. Cache miss — load from Postgres in parallel
  const [profile, corrections, patterns] = await Promise.all([
    db.query.userWritingProfiles.findFirst({
      where: eq(userWritingProfiles.userId, userId),
    }),
    db
      .select()
      .from(aiCorrections)
      .where(
        and(
          eq(aiCorrections.userId, userId),
          isNull(aiCorrections.collapsedAt) // only uncollapsed (recent) ones
        )
      )
      .orderBy(desc(aiCorrections.createdAt))
      .limit(10), // only last 10 raw corrections in cache
    db
      .select()
      .from(recipientPatterns)
      .where(eq(recipientPatterns.userId, userId)),
  ]);

  const context: UserContext = {
    profile:     profile ?? null,
    corrections,
    patterns,
  };

  // 3. Write to Redis — fire and forget, never block
  redis
    .set(cacheKey, context, { ex: CACHE_TTL_SECONDS })
    .catch(err => console.warn("[ai-context] Redis set failed:", err));

  return context;
}

// Bust cache when corrections are saved or profile is updated
export async function invalidateUserContext(userId: string): Promise<void> {
  await redis.del(`ctx:${userId}`).catch(() => {});
}

// Build the actual string injected into the AI system prompt
// Hard cap: ~600 tokens total so it never bloats the context window
export function buildContextPrompt(
  ctx: UserContext,
  recipientEmail?: string
): string {
  const parts: string[] = [];

  // Part 1: Writing style summary (~200 tokens)
  if (ctx.profile?.writingStyleSummary) {
    parts.push(`User writing style:\n${ctx.profile.writingStyleSummary}`);
  } else if (ctx.profile) {
    // No summary yet — build a basic one from raw fields
    const basics: string[] = [];
    if (ctx.profile.tone) basics.push(`tone: ${ctx.profile.tone}`);
    if (ctx.profile.avgEmailLength) basics.push(`avg length: ${ctx.profile.avgEmailLength} words`);
    if (ctx.profile.commonGreetings?.length)
      basics.push(`common greetings: ${ctx.profile.commonGreetings.slice(0, 3).join(", ")}`);
    if (ctx.profile.commonClosings?.length)
      basics.push(`common closings: ${ctx.profile.commonClosings.slice(0, 3).join(", ")}`);
    if (basics.length) parts.push(`User writing style:\n- ${basics.join("\n- ")}`);
  }

  // Part 2: Recipient-specific rule (~100 tokens)
  if (recipientEmail) {
    const rule = ctx.patterns.find(
      p => p.recipientEmail.toLowerCase() === recipientEmail.toLowerCase()
    );
    if (rule) {
      const ruleLines: string[] = [];
      if (rule.preferredTone) ruleLines.push(`use ${rule.preferredTone} tone`);
      if (rule.maxWordCount)  ruleLines.push(`keep under ${rule.maxWordCount} words`);
      if (rule.customNotes)   ruleLines.push(rule.customNotes);
      if (ruleLines.length) {
        parts.push(`For emails to ${recipientEmail}:\n- ${ruleLines.join("\n- ")}`);
      }
    }
  }

  // Part 3: Last 5 corrections to avoid repeating (~300 tokens)
  const recentCorrections = ctx.corrections.slice(0, 5);
  if (recentCorrections.length > 0) {
    const lines = recentCorrections.map(c => {
      const original = c.aiDraftText.slice(0, 120).replace(/\n/g, " ");
      const edited   = c.userEditedText.slice(0, 120).replace(/\n/g, " ");
      return `- Avoid: "${original}…"\n  Prefer: "${edited}…"`;
    });
    parts.push(`Recent corrections — do not repeat these patterns:\n${lines.join("\n")}`);
  }

  if (parts.length === 0) return ""; // new user, no context yet

  return `[User context — follow these preferences]\n${parts.join("\n\n")}`;
}
