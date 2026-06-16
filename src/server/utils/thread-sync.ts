import { eq, and, sql } from "drizzle-orm";
import { corsairEntities, corsairAccounts } from "~/server/db/corsair-schema";
import { corsair } from "~/server/corsair";
import { randomUUID } from "crypto";

export async function ensureThreadSynced(ctx: any, threadId: string, tenantId: string): Promise<void> {
  // Check if thread exists in DB
  const existing = await ctx.db
    .select({ id: corsairEntities.id })
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
    .limit(1);

  if (existing.length > 0) {
    return; // Already synced
  }

  try {
    const client = corsair.withTenant(tenantId);
    const accountRow = await ctx.db
      .select({ id: corsairAccounts.id })
      .from(corsairAccounts)
      .where(eq(corsairAccounts.tenantId, tenantId))
      .limit(1);

    if (accountRow.length === 0) return;
    const accountId = accountRow[0].id;

    // Fetch the full thread from Gmail
    const thread = (await client.gmail!.api!.threads!.get({
      id: threadId,
      format: "full",
    })) as any;

    if (thread?.messages && Array.isArray(thread.messages)) {
      // Insert all messages in the thread into the local cache
      for (const msg of thread.messages) {
        await ctx.db.insert(corsairEntities).values({
          id: randomUUID(),
          accountId,
          entityId: msg.id,
          entityType: "messages",
          version: String(msg.historyId ?? "1"),
          data: msg,
          isRead: !(msg.labelIds?.includes("UNREAD")),
        });
      }
    }
  } catch (error) {
    console.error(`[ensureThreadSynced] Failed to sync thread ${threadId}:`, error);
  }
}
