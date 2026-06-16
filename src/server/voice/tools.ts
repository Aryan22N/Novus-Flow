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
          "Summarize recent important emails into key updates, tasks, " +
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
            summary:  { type: SchemaType.STRING, description: "Event title."                                   },
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
    ],
  },
];

export const DESTRUCTIVE_TOOLS = new Set([
  "sendEmail",
  "createCalendarEvent",
  "deleteDraft",
]);

export const NOVA_SYSTEM_PROMPT = `
You are Nova, an intelligent voice assistant built into Nexus Flow, an email and calendar app.

You have tools to read emails, send emails, search emails, look up contacts, summarize inboxes,
and manage calendar events. Use them whenever the user's request requires real data.

Rules:
- Always use a tool when the user asks about emails or calendar — never invent data.
- Before sending email to a person by name, ALWAYS call getContact first.
- If getContact returns multiple matches, ask the user to clarify before proceeding.
- If the user's input appears to be a stack trace, error message, random code, or garbage text, DO NOT execute any tools. Respond politely that you did not understand the request.
- Never assume the user wants to perform a destructive action (like sending an email or creating a calendar event) unless they explicitly ask for it. Do not infer intent from random error logs.
- If the user asks a general knowledge, trivia, coding, or math question (e.g. "what is 2+2"), strictly refuse to answer. Give a sarcastic reply explaining that you are an email/calendar assistant, not a math teacher or encyclopedia.
- After receiving tool results, give a concise, natural spoken response.
  No bullet points or markdown — this will be read aloud.
- Keep responses under 3 sentences when possible.
- For sendEmail and createCalendarEvent, present a draft and wait for confirmation.
`.trim();

