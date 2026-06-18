import { type Session, type User } from "better-auth";
import { createCaller } from "~/server/api/root";
import { db } from "~/server/db";
import { type NovaSession } from "./session";
import { DESTRUCTIVE_TOOLS } from "./tools";

type AuthSession = { session: Session; user: User };

function buildCaller(session: AuthSession) {
  return createCaller({ db, session, headers: new Headers() });
}

export interface ToolResult {
  data:                  unknown;
  confirmationRequired?: {
    draft: string;
    tool:  string;
    args:  Record<string, unknown>;
  };
}

export async function executeTool(
  toolName: string,
  args:     Record<string, unknown>,
  session:  AuthSession,
  novaSession: NovaSession,
): Promise<ToolResult> {
  try {
    const caller = buildCaller(session);

    // ── READ TOOLS ────────────────────────────────────────────────────────────

    if (toolName === "readInbox") {
      const filter = (args.filter as string) ?? "unread";
      const count  = Math.min((args.count as number) ?? 5, 10);
      const result = await caller.email.getInboxThreads({ 
        page: 1,
        unreadOnly: filter === "unread",
        isStarred: filter === "starred" ? true : undefined,
      });
      const emails = result.emails.slice(0, count).map((e) => ({
        from:    e.sender,
        subject: e.subject,
        date:    e.date,
        unread:  e.unread,
      }));
      return { data: { emails, total: result.total } };
    }

    if (toolName === "summarizeInbox") {
      const onlyImportant = (args.onlyImportant as boolean) ?? false;
      const result = await caller.ai.summarizeRecentEmails({ onlyImportant });
      return { data: result };
    }

    if (toolName === "searchEmails") {
      const query  = (args.query as string);
      const result = await caller.email.searchEmails({ query });
      const matches = result.emails
        .slice(0, 8)
        .map((e) => ({ from: e.sender, subject: e.subject, threadId: e.threadId, date: e.date }));
      return { data: { matches, count: matches.length } };
    }

    if (toolName === "getContact") {
      // Problem 3 fix: query the contacts table (all historical contacts) instead
      // of scanning the last 50 inbox threads which misses older contacts.
      const name    = (args.name as string).toLowerCase();
      const results = await caller.email.searchContacts({ query: name });

      if (results.length === 0)
        return { data: { found: false, message: `No contact found matching "${args.name as string}".` } };

      if (results.length === 1) {
        novaSession.lastContext.emailAddress = results[0]!.email;
        return { data: { found: true, contact: { name: results[0]!.name, email: results[0]!.email } } };
      }

      return {
        data: {
          found:    true,
          multiple: true,
          contacts: results.map(c => ({ name: c.name, email: c.email })),
        },
      };
    }

    if (toolName === "getCalendarEvents") {
      const result = await caller.calendar.getEvents({});
      const now    = new Date();
      const when   = (args.when as string) ?? "today";

      const filtered = result.events.filter((e) => {
        const start = new Date(e.start || Date.now());
        if (when === "today")    return start.toDateString() === now.toDateString();
        if (when === "tomorrow") {
          const tom = new Date(now);
          tom.setDate(tom.getDate() + 1);
          return start.toDateString() === tom.toDateString();
        }
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return start >= now && start <= weekEnd;
      });

      return { data: { events: filtered.slice(0, 8) } };
    }

    // ── CONFIRMATION GATE ─────────────────────────────────────────────────────

    if (DESTRUCTIVE_TOOLS.has(toolName)) {
      let draft = "";

      if (toolName === "sendEmail") {
        draft =
          `Send email to ${args.to as string}` +
          (args.subject ? ` — subject: "${args.subject as string}"` : "") +
          (args.attachments && Array.isArray(args.attachments) && args.attachments.length > 0 ? `\n[Attachments: ${args.attachments.map((att: any) => att.name).join(', ')}]` : "") +
          `\n\n${(args.body as string).slice(0, 200)}${(args.body as string).length > 200 ? "…" : ""}`;
      }

      if (toolName === "createCalendarEvent") {
        draft =
          `Create event: "${args.summary as string}" at ${args.time as string}` +
          (args.duration ? ` for ${args.duration as string}` : "") +
          (args.description ? `\nDescription: ${(args.description as string).slice(0, 100)}...` : "");
      }

      if (toolName === "deleteCalendarEvent") {
        draft = `Delete calendar event: "${args.summary as string}"`;
      }

      return {
        data: { status: "awaiting_confirmation" },
        confirmationRequired: { draft, tool: toolName, args },
      };
    }

    // ── CONFIRMED EXECUTION ───────────────────────────────────────────────────

    if (toolName === "__confirmed_sendEmail") {
      const a      = args as { to: string; subject?: string; body: string; attachments?: {name: string, url: string}[] };
      const result = await caller.email.sendEmail({
        to:      a.to,
        subject: a.subject ?? "(no subject)",
        body:    a.body,
        attachments: a.attachments,
      });
      return { data: { sent: true, messageId: result.messageId } };
    }

    if (toolName === "__confirmed_createCalendarEvent") {
      const a           = args as { summary: string; description?: string; time: string; duration?: string };
      const meetingTime = a.duration ? `${a.time} for ${a.duration}` : a.time;
      const result      = await caller.calendar.createEvent({ summary: a.summary, description: a.description, meetingTime });
      return { data: { created: true, event: result.event } };
    }

    if (toolName === "__confirmed_deleteCalendarEvent") {
      const a = args as { eventId: string };
      const result = await caller.calendar.deleteEvent({ eventId: a.eventId });
      return { data: { deleted: true } };
    }

    return { data: { error: `Unknown tool: ${toolName}` } };
  } catch (err: any) {
    console.error(`[executeTool] Error running ${toolName}:`, err);
    return {
      data: {
        error: err?.message || String(err),
      },
    };
  }
}
