import { db } from '../src/server/db';
import { sql } from 'drizzle-orm';

async function main() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS draft_mail (id text PRIMARY KEY NOT NULL, tenant_id text NOT NULL REFERENCES public.user(id) ON DELETE cascade, "to" text, cc text, bcc text, subject text, body text, created_at timestamp NOT NULL, updated_at timestamp NOT NULL)`);
  console.log('created');
  process.exit(0);
}
main();
