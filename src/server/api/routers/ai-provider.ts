import { env } from "~/env";
import OpenAI from "openai";

export interface ThreadAnalysisResult {
  summary: string;
  tasks: string[];
  isMeetingRelated: boolean;
  meetingDetails: {
    proposedTopic: string | null;
    suggestedDateTimes: string[];
  };
  defaultDraft: string;
}

export interface DraftReplyResult {
  draft: string;
}

export interface GlobalDraftResult {
  to: string;
  subject: string;
  draft: string;
  isMeetingRelated: boolean;
  meetingDetails?: {
    summary: string;
    meetingTime: string;
  };
}

export interface SuggestedRepliesResult {
  suggestions: string[];
}

export interface ChatResult {
  reply: string;
}

export interface EmailSummaryResult {
  updates: string[];
  tasks: string[];
  meetings: string[];
  deadlines: string[];
}

export interface AiProvider {
  analyzeThread(threadText: string, userContext?: string): Promise<ThreadAnalysisResult>;
  generateReplyDraft(
    threadText: string,
    userBriefPrompt: string,
    userContext?: string
  ): Promise<DraftReplyResult>;
  generateGlobalDraft(prompt: string, userContext?: string): Promise<GlobalDraftResult>;
  generateSuggestions(threadText: string): Promise<SuggestedRepliesResult>;
  summarizeRecentEmails(emailsText: string, userContext?: string): Promise<EmailSummaryResult>;
  askQuestion(prompt: string, context?: string): Promise<ChatResult>;
  summarizeWritingStyle(correctionText: string): Promise<string>;
}

class OpenAiProvider implements AiProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async analyzeThread(threadText: string, userContext?: string): Promise<ThreadAnalysisResult> {
    const contextStr = userContext ? `\n\n${userContext}` : "";
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert email assistant named Nexus Assistant. Analyze the provided email thread.${contextStr}
You must return a JSON object with the following structure:
{
  "summary": "A concise bulleted HTML/markdown list summarizing key information from the thread. (Max 3-4 bullet points)",
  "tasks": ["Task 1", "Task 2"],
  "isMeetingRelated": true/false,
  "meetingDetails": {
    "proposedTopic": "Title or topic of meeting (or null if none)",
    "suggestedDateTimes": ["Proposed time 1", "Proposed time 2"]
  },
  "defaultDraft": "A default draft reply answering the last message in a professional tone. Extract actual names from the thread for the greeting and signature (no generic '[Sender]' or '[User]' placeholders under any circumstances). Use proper line breaks '\\n\\n' to format paragraphs."
}
Return ONLY a valid JSON object. Do not include markdown code block formatting (like \`\`\`json) or any other wrapping text. Make sure suggestedDateTimes has dates/times extracted from the email if any are mentioned.`,
        },
        {
          role: "user",
          content: `Analyze this email thread:\n\n${threadText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const resultText = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(resultText) as ThreadAnalysisResult;
  }

  async generateReplyDraft(
    threadText: string,
    userBriefPrompt: string,
    userContext?: string
  ): Promise<DraftReplyResult> {
    const contextStr = userContext ? `\n\n${userContext}` : "";
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Nexus Assistant, a professional email drafter.${contextStr}
Draft a complete, contextual email response for the last sender in the thread, based on the email thread history and the user's brief response intent/description.
The user wants to say: "${userBriefPrompt}"

Follow these rules STRICTLY:
1. Extract the name of the recipient (the last message's sender) from the thread and use it in the greeting (e.g. "Hi [Sender Name]," or "Dear [Sender Name],"). Never use placeholders like "[Sender Name]".
2. Draft a natural, polished, professional reply body.
3. Sign off using "Best regards," or "Best," and use the name of the user (who is the receiver of the last message) if it's clear from the thread history. Do not use placeholders like "[User]" or "[Your Name]" under any circumstance. If the user's name is not clear, simply sign off without a name or use a standard professional signature line.
4. Format the output with proper line breaks ('\\n\\n') to structure greetings, paragraphs, and signatures. Do not return a single block of text. Ensure there is spacing between the greeting, the body, and the sign-off.
5. Return a JSON object containing the drafted reply:
{
  "draft": "The complete drafted email message body formatted with \\n\\n for paragraphs"
}
Make the email professional, helpful, and natural. Return ONLY a valid JSON object.`,
        },
        {
          role: "user",
          content: `Email thread:\n\n${threadText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const resultText = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(resultText) as DraftReplyResult;
  }

  async generateGlobalDraft(prompt: string, userContext?: string): Promise<GlobalDraftResult> {
    const contextStr = userContext ? `\n\n${userContext}` : "";
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Nexus Assistant, a professional email drafter.${contextStr}
The user wants to draft a new email. 
Extract the recipient email address, a suitable subject, and draft the email body.
If the prompt indicates scheduling a meeting or an event, set isMeetingRelated to true and provide meeting details (summary/title of meeting and meetingTime like "Tomorrow at 5 PM").

FORMATTING RULES:
1. Ensure the email body is properly formatted with spaces and line breaks.
2. Use '\\n\\n' to create line breaks between the greeting, each paragraph of the body, and the sign-off. Do not return a single block of text.

Return a JSON object containing the drafted reply:
{
  "to": "email@example.com",
  "subject": "Email Subject",
  "draft": "The complete drafted email message body formatted with \\n\\n for paragraphs...",
  "isMeetingRelated": true/false,
  "meetingDetails": {
    "summary": "Meeting title",
    "meetingTime": "Date and time"
  }
}
Return ONLY a valid JSON object.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const resultText = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(resultText) as GlobalDraftResult;
  }

  async generateSuggestions(
    threadText: string,
  ): Promise<SuggestedRepliesResult> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Nexus Assistant, an expert email assistant.
Analyze the email thread and generate exactly 3 short, contextually relevant quick-reply suggestion choices (one sentence or short phrase each) that the user can choose to quickly respond to the last email.
Return a JSON object containing the list of suggestions:
{
  "suggestions": [
    "Yes, I can attend the meeting.",
    "No, I cannot make it.",
    "Let me check my calendar and get back to you."
  ]
}
Return ONLY a valid JSON object. Make them realistic and tailored to the thread context.`,
        },
        {
          role: "user",
          content: `Email thread:\n\n${threadText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const resultText = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(resultText) as SuggestedRepliesResult;
  }

  async summarizeRecentEmails(emailsText: string, userContext?: string): Promise<EmailSummaryResult> {
    const contextStr = userContext ? `\n\n${userContext}` : "";
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Nexus Assistant, an expert email summarizer.${contextStr}
Summarize the following recent unread emails. Extract important updates, actionable tasks, meetings, and deadlines.
Return a JSON object containing the summary:
{
  "updates": ["String array of important updates"],
  "tasks": ["String array of action items"],
  "meetings": ["String array of meetings"],
  "deadlines": ["String array of deadlines"]
}
Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.`,
        },
        {
          role: "user",
          content: emailsText,
        },
      ],
      response_format: { type: "json_object" },
    });

    const resultText = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(resultText) as EmailSummaryResult;
  }

  async summarizeWritingStyle(correctionText: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model:      "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        {
          role:    "system",
          content: "Analyze email corrections and output 3–5 concise writing style rules, each under 20 words. Plain text bullet points starting with a dash. Be specific and actionable — name what to avoid and what to prefer instead.",
        },
        {
          role:    "user",
          content: `Here are corrections this user made to AI email drafts:\n\n${correctionText}\n\nWrite a brief style guide.`,
        },
      ],
    });
    return response.choices[0]?.message?.content?.trim() ?? "";
  }

  async askQuestion(prompt: string, context?: string): Promise<ChatResult> {
    const contextStr = context ? `\n\nContext:\n${context}` : "";
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `You are an expert, helpful AI assistant named Novus Assistant. You are deeply integrated into the user's workflow. Answer concisely and accurately.${contextStr}` },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });
    return { reply: response.choices[0]?.message?.content ?? "I'm sorry, I couldn't process that request." };
  }
}

class GeminiProvider implements AiProvider {
  private apiKey: string;

  constructor() {
    const key = env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    this.apiKey = key;
  }

  private async callGemini(text: string): Promise<string | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
      }),
    });
    if (!res.ok) throw new Error(`Gemini API failed: ${res.status}`);
    const data = await res.json() as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  }

  async analyzeThread(threadText: string, userContext?: string): Promise<ThreadAnalysisResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
    const contextStr = userContext ? `\n\n${userContext}` : "";

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are an expert email assistant named Nexus Assistant. Analyze the provided email thread.${contextStr}
Generate a concise summary, checklist of actionable tasks, check if it is meeting related, extract suggestions, and draft a default reply.

Make sure the draft reply is formatted properly:
- Extract actual names from the thread for the greeting and signature (no generic '[Sender]' or '[User]' placeholders under any circumstances). If the user name is provided, use it for the signature.
- Use proper line breaks '\n\n' to format paragraphs.

Email thread:
${threadText}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            summary: {
              type: "STRING",
              description:
                "A concise bulleted HTML/markdown list summarizing key information from the thread. (Max 3-4 bullet points)",
            },
            tasks: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
            isMeetingRelated: { type: "BOOLEAN" },
            meetingDetails: {
              type: "OBJECT",
              properties: {
                proposedTopic: { type: "STRING" },
                suggestedDateTimes: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
              },
              required: ["proposedTopic", "suggestedDateTimes"],
            },
            defaultDraft: {
              type: "STRING",
              description:
                "A default draft reply answering the last message in a professional tone. Extract actual names from the thread for the greeting and signature (no generic '[Sender]' or '[User]' placeholders). Use proper line breaks '\\n\\n' to format paragraphs.",
            },
          },
          required: [
            "summary",
            "tasks",
            "isMeetingRelated",
            "meetingDetails",
            "defaultDraft",
          ],
        },
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API call failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = (await response.json()) as any;
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error("Gemini returned an empty response.");
    }

    return JSON.parse(textResult) as ThreadAnalysisResult;
  }

  async generateReplyDraft(
    threadText: string,
    userBriefPrompt: string,
    userContext?: string
  ): Promise<DraftReplyResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
    const contextStr = userContext ? `\n\n${userContext}` : "";

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are Nexus Assistant, a professional email drafter.${contextStr}
Draft a complete, contextual email response for the last sender in the thread, based on the email thread history and the user's brief response intent/description.
The user wants to say: "${userBriefPrompt}"

Follow these rules STRICTLY:
1. Extract the name of the recipient (the last message's sender) from the thread and use it in the greeting (e.g. "Hi [Sender Name]," or "Dear [Sender Name],"). Never use placeholders like "[Sender Name]".
2. Draft a natural, polished, professional reply body.
3. Sign off using "Best regards," or "Best," and use the name of the user (who is the receiver of the last message) if it's clear from the thread history. Do not use placeholders like "[User]" or "[Your Name]" under any circumstance. If the user's name is not clear, simply sign off without a name or use a standard professional signature line.
4. Format the output with proper line breaks ('\\n\\n') to structure greetings, paragraphs, and signatures. Do not return a single block of text. Ensure there is spacing between the greeting, the body, and the sign-off.

Email thread:
${threadText}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            draft: { type: "STRING" },
          },
          required: ["draft"],
        },
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API call failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = (await response.json()) as any;
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error("Gemini returned an empty response.");
    }

    return JSON.parse(textResult) as DraftReplyResult;
  }

  async generateGlobalDraft(prompt: string, userContext?: string): Promise<GlobalDraftResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
    const contextStr = userContext ? `\n\n${userContext}` : "";

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are Nexus Assistant, a professional email drafter.${contextStr}
The user wants to draft a new email based on this prompt: "${prompt}"

Extract the recipient email address, a suitable subject, and draft the email body.
If the prompt indicates scheduling a meeting or an event, set isMeetingRelated to true and provide meeting details (summary/title of meeting and meetingTime like "Tomorrow at 5 PM").

FORMATTING RULES:
1. Ensure the email body is properly formatted with spaces and line breaks.
2. Use '\\n\\n' to create line breaks between the greeting, each paragraph of the body, and the sign-off. Do not return a single block of text.
`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            to: { type: "STRING" },
            subject: { type: "STRING" },
            draft: { type: "STRING" },
            isMeetingRelated: { type: "BOOLEAN" },
            meetingDetails: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING" },
                meetingTime: { type: "STRING" },
              },
              required: ["summary", "meetingTime"],
            },
          },
          required: ["to", "subject", "draft", "isMeetingRelated"],
        },
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API call failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = (await response.json()) as any;
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error("Gemini returned an empty response.");
    }

    return JSON.parse(textResult) as GlobalDraftResult;
  }

  async generateSuggestions(
    threadText: string,
  ): Promise<SuggestedRepliesResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are Nexus Assistant, an expert email assistant.
Analyze the email thread and generate exactly 3 short, contextually relevant quick-reply suggestion choices (one sentence or short phrase each) that the user can choose to quickly respond to the last email.

Email thread:
${threadText}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            suggestions: {
              type: "ARRAY",
              items: { type: "STRING" },
              description:
                "List of exactly 3 short, contextually relevant quick-reply suggestions.",
            },
          },
          required: ["suggestions"],
        },
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API call failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = (await response.json()) as any;
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error("Gemini returned an empty response.");
    }

    return JSON.parse(textResult) as SuggestedRepliesResult;
  }

  async summarizeRecentEmails(emailsText: string, userContext?: string): Promise<EmailSummaryResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
    const contextStr = userContext ? `\n\n${userContext}` : "";

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are Nexus Assistant, an expert email summarizer.${contextStr}
Summarize the following recent unread emails. Extract important updates, actionable tasks, meetings, and deadlines.

Recent Emails:
${emailsText}
`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            updates: { type: "ARRAY", items: { type: "STRING" } },
            tasks: { type: "ARRAY", items: { type: "STRING" } },
            meetings: { type: "ARRAY", items: { type: "STRING" } },
            deadlines: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["updates", "tasks", "meetings", "deadlines"],
        },
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API call failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = (await response.json()) as any;
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error("Gemini returned an empty response.");
    }

    return JSON.parse(textResult) as EmailSummaryResult;
  }

  async summarizeWritingStyle(correctionText: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text:
              "Analyze these email corrections and output 3–5 concise writing style rules, each under 20 words. " +
              "Plain text bullet points starting with a dash.\n\n" +
              `Corrections:\n${correctionText}\n\nWrite a brief style guide.`,
          }],
        }],
        generationConfig: { maxOutputTokens: 300 },
      }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API call failed with status ${res.status}: ${errorText}`);
    }
    const data = await res.json() as {
      candidates: [{ content: { parts: [{ text: string }] } }]
    };
    return data.candidates[0]?.content.parts[0]?.text?.trim() ?? "";
  }

  async askQuestion(prompt: string, context?: string): Promise<ChatResult> {
    const contextStr = context ? `\n\nContext:\n${context}` : "";
    const fullPrompt = `You are an expert, helpful AI assistant named Novus Assistant. You are deeply integrated into the user's workflow. Answer concisely and accurately.\n${contextStr}\n\nUser Question:\n${prompt}`;
    const reply = await this.callGemini(fullPrompt);
    return { reply: reply ?? "I'm sorry, I couldn't process that request." };
  }
}

export function getAiProvider(): AiProvider {
  const provider = env.AI_PROVIDER || "openai";
  console.log(`[AI-PROVIDER] Initializing model provider: "${provider}"`);
  if (provider === "gemini") {
    return new GeminiProvider();
  }
  return new OpenAiProvider();
}
