import type { Citation, SessionSummary } from '@/types';

const KEYS = {
  userId: 'askmydocs.user_id',
  sessions: 'askmydocs.sessions',
  activeSession: 'askmydocs.active_session',
  citations: 'askmydocs.citations',
} as const;

/** Browser storage is best-effort: private windows and blocked site data must not break the app. */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — state simply does not survive reload */
  }
}

export const storage = {
  getUserId(): string {
    const existing = read<string | null>(KEYS.userId, null);
    if (existing) return existing;
    const generated = `user_${Math.random().toString(36).slice(2, 10)}`;
    write(KEYS.userId, generated);
    return generated;
  },

  getSessions(): SessionSummary[] {
    return read<SessionSummary[]>(KEYS.sessions, []);
  },

  setSessions(sessions: SessionSummary[]): void {
    write(KEYS.sessions, sessions);
  },

  getActiveSessionId(): string | null {
    return read<string | null>(KEYS.activeSession, null);
  },

  setActiveSessionId(sessionId: string): void {
    write(KEYS.activeSession, sessionId);
  },

  /**
   * The backend persists message text only, so citations are cached locally
   * and re-attached when a past session is replayed.
   */
  getCitations(sessionId: string): Record<string, Citation[]> {
    const all = read<Record<string, Record<string, Citation[]>>>(KEYS.citations, {});
    return all[sessionId] ?? {};
  },

  saveCitations(sessionId: string, answerKey: string, citations: Citation[]): void {
    const all = read<Record<string, Record<string, Citation[]>>>(KEYS.citations, {});
    all[sessionId] = { ...(all[sessionId] ?? {}), [answerKey]: citations };
    write(KEYS.citations, all);
  },

  dropCitations(sessionId: string): void {
    const all = read<Record<string, Record<string, Citation[]>>>(KEYS.citations, {});
    delete all[sessionId];
    write(KEYS.citations, all);
  },
};

/** Answers are keyed by a stable hash of their text, since the API returns no message id. */
export function citationKey(answer: string): string {
  let hash = 0;
  for (let i = 0; i < answer.length; i += 1) {
    hash = (hash << 5) - hash + answer.charCodeAt(i);
    hash |= 0;
  }
  return `a${hash}`;
}
