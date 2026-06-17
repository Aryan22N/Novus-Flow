import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema.js";
import * as corsairSchema from "../src/server/db/corsair-schema.js";

const sourceConn = postgres("postgresql://postgres:2252006@localhost:5432/superman_clone");
const destConn = postgres("postgresql://neondb_owner:npg_zk2GfB0YUIrx@ep-odd-tree-aiomaaav.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require");

const sourceDb = drizzle(sourceConn);
const destDb = drizzle(destConn);

async function migrate() {
  console.log("Starting reliable data migration...");
  const tables = [
    { table: corsairSchema.corsairIntegrations, name: "corsair_integrations" },
    { table: schema.user, name: "user" },
    { table: schema.account, name: "account" },
    { table: schema.session, name: "session" },
    { table: schema.verification, name: "verification" },
    { table: corsairSchema.corsairAccounts, name: "corsair_accounts" },
    { table: corsairSchema.corsairEntities, name: "corsair_entities" },
    { table: corsairSchema.corsairEvents, name: "corsair_events" },
    { table: schema.contacts, name: "contacts" },
    { table: schema.draftMail, name: "draft_mail" },
    { table: schema.sentMail, name: "sent_mail" },
    { table: schema.subscriptions, name: "subscriptions" },
    { table: schema.userWritingProfiles, name: "user_writing_profiles" },
    { table: schema.aiCorrections, name: "ai_corrections" },
    { table: schema.recipientPatterns, name: "recipient_patterns" },
  ];

  for (const { table, name } of tables) {
    try {
      console.log(`Reading from ${name}...`);
      const data = await sourceDb.select().from(table);
      if (data.length > 0) {
        console.log(`Migrating ${data.length} rows to ${name}...`);
        for (let i = 0; i < data.length; i += 500) {
          const chunk = data.slice(i, i + 500);
          await destDb.insert(table).values(chunk).onConflictDoNothing();
        }
      }
    } catch (e) {
      console.error(`Failed to migrate ${name}:`, e);
    }
  }
  
  console.log("Migration complete!");
  process.exit(0);
}

migrate();
