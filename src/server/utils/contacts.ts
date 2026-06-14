/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { contacts } from "../db/schema";

/**
 * Parses email header fields (like From, To, Cc) to extract all email addresses and their associated names.
 * Supports standard RFC 2822 email format and lists:
 *   - "Name" <email@domain.com>
 *   - Name <email@domain.com>
 *   - email@domain.com
 *   - "Last, First" <email@domain.com>
 */
export function parseEmailHeader(headerValue?: string): { name: string; email: string }[] {
  if (!headerValue) return [];
  const results: { name: string; email: string }[] = [];

  // Regex pattern matching either:
  // 1) ("Name"|<Name>)\s*<email>
  // 2) Standalone email address
  const regex = /("([^"]+)"|([^<,\s][^<,]*?))\s*<([^>]+)>|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

  let match;
  while ((match = regex.exec(headerValue)) !== null) {
    let name = "";
    let email = "";

    if (match[4]) {
      // Matches the "Name <email>" pattern
      name = (match[2] ?? match[3] ?? "").trim();
      email = match[4].trim();
    } else if (match[5]) {
      // Matches standalone email
      email = match[5].trim();
      // Generate fallback name from email prefix
      const localPart = email.split("@")[0] ?? "";
      name = localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }

    if (email) {
      // Always normalize emails to lowercase
      results.push({
        name,
        email: email.toLowerCase().trim(),
      });
    }
  }

  return results;
}

interface UpsertContactsParams {
  db: any;
  userId: string;
  userEmail?: string;
  from?: string;
  to?: string;
  cc?: string;
  date?: Date;
}

/**
 * Extracts contacts from From, To, and Cc headers, deduplicates them,
 * and performs an atomic PG UPSERT to update interaction counts and recency.
 */
export async function upsertContactsForEmail({
  db,
  userId,
  userEmail,
  from,
  to,
  cc,
  date = new Date(),
}: UpsertContactsParams): Promise<void> {
  const extracted = [
    ...parseEmailHeader(from),
    ...parseEmailHeader(to),
    ...parseEmailHeader(cc),
  ];

  // Deduplicate and filter out user's own email
  const uniqueContacts = new Map<string, string>();
  const normalizedUserEmail = userEmail?.toLowerCase().trim();

  for (const c of extracted) {
    const email = c.email.toLowerCase().trim();
    if (normalizedUserEmail && email === normalizedUserEmail) {
      continue;
    }
    // Keep name if already has one, or overwrite if we have a better/longer name
    const existingName = uniqueContacts.get(email);
    if (!uniqueContacts.has(email) || (!existingName && c.name)) {
      uniqueContacts.set(email, c.name);
    }
  }

  // Perform UPSERTs
  for (const [email, name] of uniqueContacts.entries()) {
    try {
      await db
        .insert(contacts)
        .values({
          id: randomUUID(),
          userId,
          email,
          name: name || null,
          lastContactedAt: date,
          interactionCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [contacts.userId, contacts.email],
          set: {
            name: sql`COALESCE(EXCLUDED.name, contacts.name)`,
            lastContactedAt: sql`GREATEST(contacts.last_contacted_at, EXCLUDED.last_contacted_at)`,
            interactionCount: sql`contacts.interaction_count + 1`,
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.error(`Failed to upsert contact ${email} for user ${userId}:`, err);
    }
  }
}
