import { redis } from "~/server/redis";

export interface NovaSession {
  history: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }>;
  lastContext: {
    threadId?:     string;
    emailAddress?: string;
    draftId?:      string;
  };
  pendingAction?: {
    tool:  string;
    args:  Record<string, unknown>;
    draft: string;
  };
  pendingActions?: Array<{
    tool:  string;
    args:  Record<string, unknown>;
    draft: string;
  }>;
}

export interface NovaChatMeta {
  chatId: string;
  initialText: string;
  createdAt: number;
}

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

function sessionKey(userId: string, chatId?: string) {
  if (chatId) return `nova:session:${userId}:${chatId}`;
  return `nova:session:${userId}`;
}

function chatListKey(userId: string) {
  return `nova:chatlist:${userId}`;
}

export async function getNovaSession(userId: string, chatId?: string): Promise<NovaSession> {
  try {
    const raw = await redis.get<NovaSession>(sessionKey(userId, chatId));
    return raw ?? { history: [], lastContext: {} };
  } catch {
    return { history: [], lastContext: {} };
  }
}

export async function saveNovaSession(
  userId: string,
  session: NovaSession,
  chatId?: string,
): Promise<void> {
  try {
    await redis.set(
      sessionKey(userId, chatId),
      { ...session, history: session.history.slice(-100) },
      { ex: SESSION_TTL },
    );
  } catch {
    // Redis failure is non-fatal
  }
}

export async function clearNovaSession(userId: string, chatId?: string): Promise<void> {
  try {
    await redis.del(sessionKey(userId, chatId));
    if (chatId) {
       const list = await getUserChatList(userId);
       const filtered = list.filter(c => c.chatId !== chatId);
       await redis.set(chatListKey(userId), filtered, { ex: SESSION_TTL });
    }
  } catch {}
}

export async function getUserChatList(userId: string): Promise<NovaChatMeta[]> {
  try {
    const raw = await redis.get<NovaChatMeta[]>(chatListKey(userId));
    return raw ?? [];
  } catch {
    return [];
  }
}

export async function createNewChat(userId: string, chatId: string, initialText: string): Promise<void> {
  try {
    const list = await getUserChatList(userId);
    // Remove if already exists
    const filtered = list.filter(c => c.chatId !== chatId);
    filtered.unshift({
      chatId,
      initialText: initialText.substring(0, 100),
      createdAt: Date.now(),
    });
    await redis.set(chatListKey(userId), filtered.slice(0, 50), { ex: SESSION_TTL });
  } catch {}
}
