/**
 * Sesiones del chat del agente solo en localStorage (sin BD).
 * v3: un blob por sesión; índice con metadatos y sesión activa.
 */

export const LEGACY_CHAT_V1_PREFIX = 'smarter-agent-chat-v1:';
export const LEGACY_CHAT_V2_PREFIX = 'smarter-agent-chat-v2:';

const SESSIONS_INDEX_PREFIX = 'smarter-agent-sessions-v1:';
const CHAT_V3_PREFIX = 'smarter-agent-chat-v3:';

export type SessionMeta = {
  id: string;
  title: string;
  updatedAt: number;
};

export type SessionsIndex = {
  activeSessionId: string;
  sessions: SessionMeta[];
};

export function newSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function indexKey(userId: string) {
  return `${SESSIONS_INDEX_PREFIX}${userId}`;
}

export function messagesKey(userId: string, sessionId: string) {
  return `${CHAT_V3_PREFIX}${userId}:${sessionId}`;
}

export function loadSessionsIndex(userId: string): SessionsIndex | null {
  try {
    const raw = localStorage.getItem(indexKey(userId));
    if (!raw) return null;
    const o = JSON.parse(raw) as SessionsIndex;
    if (!o?.activeSessionId || !Array.isArray(o.sessions) || o.sessions.length === 0) return null;
    return o;
  } catch {
    return null;
  }
}

export function saveSessionsIndex(userId: string, idx: SessionsIndex) {
  try {
    localStorage.setItem(indexKey(userId), JSON.stringify(idx));
  } catch {
    /* ignore */
  }
}

export function loadSessionMessagesRaw(userId: string, sessionId: string): string | null {
  try {
    return localStorage.getItem(messagesKey(userId, sessionId));
  } catch {
    return null;
  }
}

export function saveSessionMessagesRaw(userId: string, sessionId: string, json: string) {
  try {
    localStorage.setItem(messagesKey(userId, sessionId), json);
  } catch {
    /* ignore */
  }
}

export function removeSessionMessages(userId: string, sessionId: string) {
  try {
    localStorage.removeItem(messagesKey(userId, sessionId));
  } catch {
    /* ignore */
  }
}

export function createInitialSessionsIndex(): SessionsIndex {
  const sid = newSessionId();
  return {
    activeSessionId: sid,
    sessions: [{ id: sid, title: 'Nuevo chat', updatedAt: Date.now() }],
  };
}

/**
 * Migra el único hilo v1/v2 a la primera sesión v3 y crea el índice.
 */
export function migrateLegacyChatToSessions(userId: string): SessionsIndex | null {
  try {
    let raw = localStorage.getItem(`${LEGACY_CHAT_V2_PREFIX}${userId}`);
    if (!raw) raw = localStorage.getItem(`${LEGACY_CHAT_V1_PREFIX}${userId}`);
    if (!raw) return null;
    const sid = newSessionId();
    saveSessionMessagesRaw(userId, sid, raw);
    const idx: SessionsIndex = {
      activeSessionId: sid,
      sessions: [{ id: sid, title: 'Conversación anterior', updatedAt: Date.now() }],
    };
    saveSessionsIndex(userId, idx);
    return idx;
  } catch {
    return null;
  }
}

export function deriveSessionTitleFromMessages(messages: Array<{ role: string; content: string }>): string {
  const firstUser = messages.find((m) => m.role === 'user' && m.content.trim());
  if (firstUser) {
    const t = firstUser.content.trim().replace(/\s+/g, ' ');
    return t.length > 42 ? `${t.slice(0, 40)}…` : t;
  }
  return 'Nuevo chat';
}
