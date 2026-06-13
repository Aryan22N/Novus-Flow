import { type NextRequest, NextResponse } from "next/server";
import { env }              from "~/env";
import { db }               from "~/server/db";
import { aiCorrections, userWritingProfiles } from "~/server/db/schema";
import { invalidateUserContext }              from "~/server/api/routers/ai-context";
import { getAiProvider }    from "~/server/api/routers/ai-provider";
import { eq, desc, isNull, and, gte, count } from "drizzle-orm";

function isAuthorized(req: NextRequest): boolean {
  const secret     = req.headers.get("x-cron-secret");
  const vercelCron = req.headers.get("x-vercel-cron");
  return secret === env.CRON_SECRET || vercelCron === "1";
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ status: "ok", route: "summarize-context" });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startedAt = Date.now();
  const results: { userId: string; status: "ok" | "skipped" | "error"; reason?: string }[] = [];

  try {
    // Find users with 20+ uncollapsed corrections
    const usersToProcess = await db
      .select({ userId: aiCorrections.userId, total: count() })
      .from(aiCorrections)
      .where(isNull(aiCorrections.collapsedAt))
      .groupBy(aiCorrections.userId)
      .having(gte(count(), 20));

    if (usersToProcess.length === 0) {
      return NextResponse.json({ processed: 0, message: "No users to process", durationMs: Date.now() - startedAt });
    }

    const provider = getAiProvider();

    for (const { userId } of usersToProcess) {
      try {
        // Pull up to 50 most recent uncollapsed corrections
        const corrections = await db
          .select()
          .from(aiCorrections)
          .where(and(eq(aiCorrections.userId, userId), isNull(aiCorrections.collapsedAt)))
          .orderBy(desc(aiCorrections.createdAt))
          .limit(50);

        if (corrections.length < 20) {
          results.push({ userId, status: "skipped", reason: "race condition — under threshold" });
          continue;
        }

        // Build input for summarization
        const correctionText = corrections
          .map((c, i) =>
            `[${i + 1}] Type: ${c.correctionType ?? "unknown"}\n` +
            `    AI wrote:    "${c.aiDraftText.slice(0, 200).replace(/\n/g, " ")}"\n` +
            `    User changed: "${c.userEditedText.slice(0, 200).replace(/\n/g, " ")}"`
          )
          .join("\n\n");

        // Ask AI to compress into a style summary
        const summary = await provider.summarizeWritingStyle(correctionText);

        // Upsert the profile
        await db
          .insert(userWritingProfiles)
          .values({ userId, writingStyleSummary: summary, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: userWritingProfiles.userId,
            set:    { writingStyleSummary: summary, updatedAt: new Date() },
          });

        // Mark these corrections as collapsed — won't be reprocessed
        await db
          .update(aiCorrections)
          .set({ collapsedAt: new Date() })
          .where(and(eq(aiCorrections.userId, userId), isNull(aiCorrections.collapsedAt)));

        // Bust Redis so next request gets the fresh summary
        await invalidateUserContext(userId);

        results.push({ userId, status: "ok" });
      } catch (err) {
        console.error(`[summarize-context] Failed for ${userId}:`, err);
        results.push({ userId, status: "error", reason: String(err) });
        // continue to next user — one failure must not abort the job
      }
    }
  } catch (globalErr) {
    console.error(`[summarize-context] Global job failure:`, globalErr);
    return NextResponse.json({ error: "Internal Server Error", message: String(globalErr) }, { status: 500 });
  }

  return NextResponse.json({
    processed:  results.length,
    ok:         results.filter(r => r.status === "ok").length,
    skipped:    results.filter(r => r.status === "skipped").length,
    error:      results.filter(r => r.status === "error").length,
    durationMs: Date.now() - startedAt,
  });
}
