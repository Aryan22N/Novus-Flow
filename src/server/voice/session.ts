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
}

const SESSION_TTL = 60 * 30; // 30 minutes

function key(userId: string) {
  return `nova:session:${userId}`;
}

export async function getNovaSession(userId: string): Promise<NovaSession> {
  try {
    const raw = await redis.get<NovaSession>(key(userId));
    return raw ?? { history: [], lastContext: {} };
  } catch {
    return { history: [], lastContext: {} };
  }
}

export async function saveNovaSession(
  userId: string,
  session: NovaSession,
): Promise<void> {
  try {
    await redis.set(
      key(userId),
      { ...session, history: session.history.slice(-12) },
      { ex: SESSION_TTL },
    );
  } catch {
    // Redis failure is non-fatal
  }
}

export async function clearNovaSession(userId: string): Promise<void> {
  try {
    await redis.del(key(userId));
  } catch {}
}
