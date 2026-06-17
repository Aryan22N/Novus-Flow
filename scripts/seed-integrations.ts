import { db } from "../src/server/db/index";
import { corsairIntegrations } from "../src/server/db/corsair-schema";

async function main() {
  console.log("Seeding integrations...");
  await db.insert(corsairIntegrations).values([
    { id: "gmail", name: "gmail" },
    { id: "googlecalendar", name: "googlecalendar" }
  ]).onConflictDoNothing();
  console.log("Integrations successfully added to remote Neon DB!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding integrations:", err);
  process.exit(1);
});
