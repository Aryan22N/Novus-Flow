import { type NextRequest, NextResponse } from "next/server";
import { env }              from "~/env";
import { db }               from "~/server/db";
import { corsairAccounts }  from "~/server/db/corsair-schema";
import { corsair }          from "~/server/corsair";

function isAuthorized(req: NextRequest): boolean {
  const secret     = req.headers.get("x-cron-secret");
  const vercelCron = req.headers.get("x-vercel-cron");
  return secret === env.CRON_SECRET || vercelCron === "1";
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return executeRenewal();
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return executeRenewal();
}

async function executeRenewal() {
  const startedAt = Date.now();
  const results: { tenantId: string; status: "ok" | "error"; reason?: string }[] = [];

  try {
    const topicName = process.env.GMAIL_PUBSUB_TOPIC;
    if (!topicName) {
      return NextResponse.json({ processed: 0, message: "GMAIL_PUBSUB_TOPIC is not set" });
    }

    // Get all unique tenants that have a connected corsair account
    const accounts = await db.select({ tenantId: corsairAccounts.tenantId }).from(corsairAccounts);
    
    // De-duplicate tenants
    const tenantIds = [...new Set(accounts.map(a => a.tenantId))];

    if (tenantIds.length === 0) {
      return NextResponse.json({ processed: 0, message: "No active tenants to renew", durationMs: Date.now() - startedAt });
    }

    for (const tenantId of tenantIds) {
      try {
        const client = corsair.withTenant(tenantId) as any;
        
        await client.gmail!.api!.users!.watch({
          userId: "me",
          requestBody: {
            topicName: topicName,
            labelIds: ["INBOX"],
          },
        });

        results.push({ tenantId, status: "ok" });
      } catch (err) {
        console.error(`[renew-webhooks] Failed for tenant ${tenantId}:`, err);
        results.push({ tenantId, status: "error", reason: String(err) });
      }
    }
  } catch (globalErr) {
    console.error(`[renew-webhooks] Global job failure:`, globalErr);
    return NextResponse.json({ error: "Internal Server Error", message: String(globalErr) }, { status: 500 });
  }

  return NextResponse.json({
    processed:  results.length,
    ok:         results.filter(r => r.status === "ok").length,
    error:      results.filter(r => r.status === "error").length,
    durationMs: Date.now() - startedAt,
  });
}
