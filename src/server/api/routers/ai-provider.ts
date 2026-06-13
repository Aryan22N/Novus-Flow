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

export interface SuggestedRepliesResult {
  suggestions: string[];
}

export interface AiProvider {
  analyzeThread(threadText: string): Promise<ThreadAnalysisResult>;
  generateReplyDraft(
    threadText: string,
    userBriefPrompt: string,
  ): Promise<DraftReplyResult>;
  generateSuggestions(threadText: string): Promise<SuggestedRepliesResult>;
}

class OpenAiProvider implements AiProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async analyzeThread(threadText: string): Promise<ThreadAnalysisResult> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert email assistant named Nexus Assistant. Analyze the provided email thread.
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
  ): Promise<DraftReplyResult> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Nexus Assistant, a professional email drafter.
Draft a complete, contextual email response for the last sender in the thread, based on the email thread history and the user's brief response intent/description.
The user wants to say: "${userBriefPrompt}"

Follow these rules STRICTLY:
1. Extract the name of the recipient (the last message's sender) from the thread and use it in the greeting (e.g. "Hi [Sender Name]," or "Dear [Sender Name],"). Never use placeholders like "[Sender Name]".
2. Draft a natural, polished, professional reply body.
3. Sign off using "Best regards," or "Best," and use the name of the user (who is the receiver of the last message) if it's clear from the thread history. Do not use placeholders like "[User]" or "[Your Name]" under any circumstance. If the user's name is not clear, simply sign off without a name or use a standard professional signature line.
4. Format the output with proper line breaks ('\n' or '\n\n') to structure greetings, paragraphs, and signatures.
5. Return a JSON object containing the drafted reply:
{
  "draft": "The complete drafted email message body"
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

  async analyzeThread(threadText: string): Promise<ThreadAnalysisResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are an expert email assistant named Nexus Assistant. Analyze the provided email thread.
Generate a concise summary, checklist of actionable tasks, check if it is meeting related, extract suggestions, and draft a default reply.

Make sure the draft reply is formatted properly:
- Extract actual names from the thread for the greeting and signature (no generic '[Sender]' or '[User]' placeholders under any circumstances).
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
  ): Promise<DraftReplyResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are Nexus Assistant, a professional email drafter.
Draft a complete, contextual email response for the last sender in the thread, based on the email thread history and the user's brief response intent/description.
The user wants to say: "${userBriefPrompt}"

Follow these rules STRICTLY:
1. Extract the name of the recipient (the last message's sender) from the thread and use it in the greeting (e.g. "Hi [Sender Name]," or "Dear [Sender Name],"). Never use placeholders like "[Sender Name]".
2. Draft a natural, polished, professional reply body.
3. Sign off using "Best regards," or "Best," and use the name of the user (who is the receiver of the last message) if it's clear from the thread history. Do not use placeholders like "[User]" or "[Your Name]" under any circumstance. If the user's name is not clear, simply sign off without a name or use a standard professional signature line.
4. Format the output with proper line breaks ('\n' or '\n\n') to structure greetings, paragraphs, and signatures.

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
}

export function getAiProvider(): AiProvider {
  const provider = env.AI_PROVIDER || "openai";
  console.log(`[AI-PROVIDER] Initializing model provider: "${provider}"`);
  if (provider === "gemini") {
    return new GeminiProvider();
  }
  return new OpenAiProvider();
}
