export interface GroundingRef {
  id: string;
  title: string;
  kind: string;
  excerpt: string;
}

export interface ChatEntry {
  role: "user" | "assistant";
  content: string;
  refs?: GroundingRef[];
  followups?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatEntry[];
  speciesName?: string;
}

const SESSIONS_KEY = "biblos.chat_sessions";
const ACTIVE_SESSION_KEY = "biblos.active_chat_session_id";

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function hasSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function notifyHistoryUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("biblos-chat-history-updated"));
  }
}

/**
 * Returns all saved chat sessions sorted by updatedAt descending.
 */
export function getChatSessions(): ChatSession[] {
  if (!hasLocalStorage()) return [];
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const sessions = JSON.parse(raw) as ChatSession[];
    return Array.isArray(sessions)
      ? sessions.sort((a, b) => b.updatedAt - a.updatedAt)
      : [];
  } catch {
    return [];
  }
}

/**
 * Saves or updates a session in localStorage.
 */
export function saveChatSession(session: ChatSession): ChatSession {
  if (!hasLocalStorage()) return session;
  const sessions = getChatSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  notifyHistoryUpdated();
  return session;
}

/**
 * Deletes a chat session by ID.
 */
export function deleteChatSession(id: string): void {
  if (!hasLocalStorage()) return;
  const sessions = getChatSessions().filter((s) => s.id !== id);
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  if (getActiveSessionId() === id) {
    setActiveSessionId(null);
  }
  notifyHistoryUpdated();
}

/**
 * Clears all saved chat sessions.
 */
export function clearAllChatSessions(): void {
  if (!hasLocalStorage()) return;
  window.localStorage.removeItem(SESSIONS_KEY);
  setActiveSessionId(null);
  notifyHistoryUpdated();
}

/**
 * Returns the currently active session ID stored in sessionStorage (tab/session scoped).
 */
export function getActiveSessionId(): string | null {
  if (!hasSessionStorage()) return null;
  return window.sessionStorage.getItem(ACTIVE_SESSION_KEY);
}

/**
 * Sets the active session ID in sessionStorage.
 */
export function setActiveSessionId(id: string | null): void {
  if (!hasSessionStorage()) return;
  if (id) {
    window.sessionStorage.setItem(ACTIVE_SESSION_KEY, id);
  } else {
    window.sessionStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

/**
 * Returns the active ChatSession object if found in localStorage.
 */
export function getActiveSession(): ChatSession | null {
  const activeId = getActiveSessionId();
  if (!activeId) return null;
  const sessions = getChatSessions();
  return sessions.find((s) => s.id === activeId) || null;
}

/**
 * Creates a brand new chat session and sets it as the active session.
 */
export function createNewChatSession(speciesName?: string): ChatSession {
  const id = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newSession: ChatSession = {
    id,
    title: "New Chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    speciesName,
  };
  setActiveSessionId(id);
  return newSession;
}

/**
 * Helper to update messages for the active session (creating a new session if needed).
 */
export function updateCurrentSessionMessages(
  messages: ChatEntry[],
  speciesName?: string
): ChatSession {
  let session = getActiveSession();
  if (!session) {
    session = createNewChatSession(speciesName);
  }

  // Derive title from first user message if title is still default
  let title = session.title;
  if (title === "New Chat" || !title) {
    const firstUserMsg = messages.find((m) => m.role === "user");
    if (firstUserMsg) {
      const cleanText = firstUserMsg.content.trim();
      title = cleanText.length > 50 ? `${cleanText.slice(0, 50)}...` : cleanText;
    }
  }

  const updated: ChatSession = {
    ...session,
    title,
    messages,
    updatedAt: Date.now(),
    speciesName: speciesName || session.speciesName,
  };

  saveChatSession(updated);
  setActiveSessionId(updated.id);
  return updated;
}

/**
 * Format relative timestamp (e.g., "Just now", "10m ago", "2h ago", "Yesterday").
 */
export function formatSessionTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60 * 1000) return "Just now";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
  if (diff < 48 * 60 * 60 * 1000) return "Yesterday";

  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
