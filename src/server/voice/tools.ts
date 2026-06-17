import { type Tool, SchemaType } from "@google/generative-ai";

export const NOVA_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "readInbox",
        description:
          "Read the user's inbox. Use when the user asks to check emails, " +
          "see what's new, or asks how many unread emails they have.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            filter: {
              type: SchemaType.STRING,
              format: "enum",
              enum: ["unread", "starred", "all"],
              description: "Which emails to fetch. Default: unread.",
            },
            count: {
              type: SchemaType.NUMBER,
              description: "How many emails to return. Default 5, max 10.",
            },
          },
          required: [],
        },
      },
      {
        name: "summarizeInbox",
        description:
          "Summarize recent emails into key updates, tasks, " +
          "meetings, and deadlines. Use when the user asks for a summary.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            scope: {
              type: SchemaType.STRING,
              format: "enum",
              enum: ["today", "unread"],
              description: "Which emails to summarize. Default: unread.",
            },
            onlyImportant: {
              type: SchemaType.BOOLEAN,
              description: "If true, skips promotional, social, and updates emails, and only summarizes important/personal ones. Use this when the user specifically asks to summarize only important emails.",
            },
          },
          required: [],
        },
      },
      {
        name: "searchEmails",
        description:
          "Search through emails by keyword, sender, or topic. Use when " +
          "the user asks to find a specific email or look something up.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: "Search query — keyword, sender name, or topic.",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "getContact",
        description:
          "Look up a contact by name to get their email address. Always " +
          "call this BEFORE sendEmail when the user refers to a person by name.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            name: {
              type: SchemaType.STRING,
              description: "The person's name or partial name to search for.",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "sendEmail",
        description:
          "Send an email on the user's behalf. Always call getContact first " +
          "if you only have a name. Requires user confirmation before executing.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            to:      { type: SchemaType.STRING, description: "Recipient email address." },
            subject: { type: SchemaType.STRING, description: "Email subject line."      },
            body: {
              type: SchemaType.STRING,
              description:
                "Full email body. Write a complete, polished email. " +
                "Apply the user's writing style.",
            },
            attachments: {
              type: SchemaType.ARRAY,
              description: "List of attachments provided by the user. Must exactly match the attachments array from the System Note if the user wants to attach files.",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  name: { type: SchemaType.STRING },
                  url: { type: SchemaType.STRING }
                }
              }
            }
          },
          required: ["to", "body"],
        },
      },
      {
        name: "createCalendarEvent",
        description:
          "Create a calendar event. Requires user confirmation before executing.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            summary:  { type: SchemaType.STRING, description: "Event title. MUST include the word 'Meeting' or 'Sync' if it is an appointment, to ensure proper categorization." },
            description: { type: SchemaType.STRING, description: "Detailed description of the event. Include agenda or notes here." },
            time:     { type: SchemaType.STRING, description: "Natural language time, e.g. 'tomorrow at 3pm'." },
            duration: { type: SchemaType.STRING, description: "How long, e.g. '30 minutes'. Optional."         },
          },
          required: ["summary", "time"],
        },
      },
      {
        name: "getCalendarEvents",
        description:
          "Fetch upcoming calendar events. Use when the user asks what's " +
          "on their schedule, calendar, or agenda.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            when: {
              type: SchemaType.STRING,
              format: "enum",
              enum: ["today", "tomorrow", "this_week"],
              description: "Time range. Default: today.",
            },
          },
          required: [],
        },
      },
      {
        name: "deleteCalendarEvent",
        description:
          "Delete or cancel a calendar event. You MUST call getCalendarEvents first to find the exact eventId before calling this tool. Requires user confirmation.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            eventId: { type: SchemaType.STRING, description: "The ID of the event to delete." },
            summary: { type: SchemaType.STRING, description: "The title of the event (for display purposes to the user)." }
          },
          required: ["eventId", "summary"],
        },
      },
    ],
  },
];

export const DESTRUCTIVE_TOOLS = new Set([
  "sendEmail",
  "createCalendarEvent",
  "deleteCalendarEvent",
  "deleteDraft",
]);

export const NOVA_SYSTEM_PROMPT = `
You are Nova, an intelligent voice assistant built into Nexus Flow, an email and calendar app.

You have tools to read emails, send emails, search emails, look up contacts, summarize inboxes,
and manage calendar events. Use them whenever the user's request requires real data.

Rules:
- Always use a tool when the user asks about emails or calendar — never invent data.
- Before sending email to a person by name, ALWAYS call getContact first.
- **CRITICAL**: If the user asks for multiple actions (e.g., sending an email AND scheduling a meeting), gather all necessary information FIRST (like calling getContact). Once you have all the info, you MUST call all the required destructive tools (e.g., sendEmail AND createCalendarEvent) simultaneously in the EXACT SAME TURN. Do not call a destructive tool if you still need to look up info for another one.
- If getContact returns multiple matches, ask the user to clarify before proceeding.
- If the user's input appears to be a stack trace, error message, random code, or garbage text, DO NOT execute any tools. Respond politely that you did not understand the request.
- Never assume the user wants to perform a destructive action (like sending an email or creating a calendar event) unless they explicitly ask for it. Do not infer intent from random error logs.
- If the user asks a general knowledge, trivia, coding, or math question (e.g. "what is 2+2"), strictly refuse to answer. Give a sarcastic reply explaining that you are an email/calendar assistant, not a math teacher or encyclopedia.
- After receiving tool results, give a concise, natural spoken response.
  No bullet points or markdown — this will be read aloud.
- Keep responses under 3 sentences when possible.
- For sendEmail and createCalendarEvent, present a draft and wait for confirmation.
`.trim();

