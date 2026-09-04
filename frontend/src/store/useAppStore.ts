import { create } from 'zustand';
import { api, toErrorMessage } from '@/lib/api';
import { citationKey, storage } from '@/lib/storage';
import { createId } from '@/lib/utils';
import type {
  ChatMessage,
  Citation,
  CodexActivity,
  HealthResponse,
  IndexedDocument,
  SessionSummary,
  UploadState,
} from '@/types';

export interface Toast {
  id: string;
  tone: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

const IDLE_UPLOAD: UploadState = {
  phase: 'idle',
  fileName: null,
  progress: 0,
  result: null,
  error: null,
};

function newSession(index: number): SessionSummary {
  const now = Date.now();
  return {
    id: createId('session'),
    title: `Session ${String(index + 1).padStart(2, '0')}`,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
  };
}

interface AppState {
  userId: string;

  health: HealthResponse | null;
  healthError: string | null;
  isHealthLoading: boolean;
  fetchHealth: () => Promise<void>;

  documents: IndexedDocument[];
  isDocumentsLoading: boolean;
  fetchDocuments: () => Promise<void>;
  deleteDocument: (docName: string) => Promise<void>;

  upload: UploadState;
  uploadDocument: (file: File) => Promise<void>;
  resetUpload: () => void;

  sessions: SessionSummary[];
  activeSessionId: string;
  createSession: () => void;
  selectSession: (sessionId: string) => Promise<void>;
  clearActiveSession: () => Promise<void>;

  messages: ChatMessage[];
  isAnswering: boolean;
  askQuestion: (question: string) => Promise<void>;

  nChunks: number;
  maxHistory: number;
  setNChunks: (value: number) => void;
  setMaxHistory: (value: number) => void;

  activity: CodexActivity;
  activeChunkCount: number;
  lastCitations: Citation[];

  activeCitation: Citation | null;
  isInspectorOpen: boolean;
  openCitation: (citation: Citation) => void;
  closeInspector: () => void;

  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;

  bootstrap: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => {
  const persistedSessions = storage.getSessions();
  const sessions = persistedSessions.length > 0 ? persistedSessions : [newSession(0)];
  const persistedActive = storage.getActiveSessionId();
  const activeSessionId =
    persistedActive && sessions.some((session) => session.id === persistedActive)
      ? persistedActive
      : sessions[0].id;

  storage.setSessions(sessions);
  storage.setActiveSessionId(activeSessionId);

  const touchSession = (sessionId: string, messageCount: number) => {
    const updated = get().sessions.map((session) =>
      session.id === sessionId ? { ...session, updatedAt: Date.now(), messageCount } : session,
    );
    storage.setSessions(updated);
    set({ sessions: updated });
  };

  /** Names a fresh session after its opening question so the history list stays scannable. */
  const titleSession = (sessionId: string, question: string) => {
    const updated = get().sessions.map((session) => {
      if (session.id !== sessionId || !/^Session \d+$/.test(session.title)) return session;
      const title = question.length > 38 ? `${question.slice(0, 38).trim()}...` : question;
      return { ...session, title };
    });
    storage.setSessions(updated);
    set({ sessions: updated });
  };

  const loadHistory = async (sessionId: string): Promise<ChatMessage[]> => {
    const history = await api.getHistory(sessionId, get().userId);
    const cached = storage.getCitations(sessionId);

    return history.messages.map((message, index) => {
      const role = message.role === 'assistant' ? 'assistant' : 'user';
      return {
        id: `${sessionId}_${index}`,
        role,
        content: message.content,
        createdAt: message.timestamp ? Date.parse(message.timestamp) : Date.now(),
        citations: role === 'assistant' ? cached[citationKey(message.content)] : undefined,
        animate: false,
      };
    });
  };

  return {
    userId: storage.getUserId(),

    health: null,
    healthError: null,
    isHealthLoading: false,

    async fetchHealth() {
      set({ isHealthLoading: true });
      try {
        const health = await api.getHealth();
        set({ health, healthError: null, isHealthLoading: false });
      } catch (error) {
        set({
          health: null,
          healthError: toErrorMessage(error, 'Health check failed.'),
          isHealthLoading: false,
        });
      }
    },

    documents: [],
    isDocumentsLoading: false,

    async fetchDocuments() {
      set({ isDocumentsLoading: true });
      try {
        const { documents } = await api.listDocuments();
        set({ documents, isDocumentsLoading: false });
      } catch (error) {
        set({ isDocumentsLoading: false });
        get().pushToast({
          tone: 'error',
          title: 'Could not load documents',
          description: toErrorMessage(error),
        });
      }
    },

    async deleteDocument(docName) {
      try {
        const result = await api.deleteDocument(docName);
        get().pushToast({
          tone: 'success',
          title: `Removed ${docName}`,
          description: `${result.deleted_chunks_count} chunks purged from the vector index.`,
        });
        await Promise.all([get().fetchDocuments(), get().fetchHealth()]);
      } catch (error) {
        get().pushToast({
          tone: 'error',
          title: 'Delete failed',
          description: toErrorMessage(error),
        });
      }
    },

    upload: IDLE_UPLOAD,

    resetUpload() {
      set({ upload: IDLE_UPLOAD });
    },

    async uploadDocument(file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        set({
          upload: {
            ...IDLE_UPLOAD,
            phase: 'error',
            fileName: file.name,
            error: 'Only PDF documents are supported.',
          },
        });
        return;
      }

      set({
        activity: 'ingesting',
        upload: {
          phase: 'uploading',
          fileName: file.name,
          progress: 0,
          result: null,
          error: null,
        },
      });

      try {
        const result = await api.uploadDocument(file, (progress) => {
          set((state) => ({
            upload: {
              ...state.upload,
              progress,
              // The server keeps working after the bytes land: extract, chunk, embed, index.
              phase: progress >= 100 ? 'indexing' : 'uploading',
            },
          }));
        });

        set({
          upload: {
            phase: 'success',
            fileName: file.name,
            progress: 100,
            result,
            error: null,
          },
        });
        get().pushToast({
          tone: 'success',
          title: `${result.doc_name} indexed`,
          description: `${result.page_count} pages | ${result.chunk_count} chunks | ${Math.round(result.execution_time_ms)}ms`,
        });
        await Promise.all([get().fetchDocuments(), get().fetchHealth()]);
      } catch (error) {
        const message = toErrorMessage(error, 'Upload failed.');
        set({
          upload: {
            phase: 'error',
            fileName: file.name,
            progress: 0,
            result: null,
            error: message,
          },
        });
        get().pushToast({ tone: 'error', title: 'Upload failed', description: message });
      } finally {
        set({ activity: 'idle' });
      }
    },

    sessions,
    activeSessionId,

    createSession() {
      const session = newSession(get().sessions.length);
      const next = [session, ...get().sessions];
      storage.setSessions(next);
      storage.setActiveSessionId(session.id);
      set({
        sessions: next,
        activeSessionId: session.id,
        messages: [],
        activeCitation: null,
        isInspectorOpen: false,
        lastCitations: [],
      });
    },

    async selectSession(sessionId) {
      if (sessionId === get().activeSessionId) return;
      storage.setActiveSessionId(sessionId);
      set({
        activeSessionId: sessionId,
        messages: [],
        activeCitation: null,
        isInspectorOpen: false,
        lastCitations: [],
      });

      try {
        const messages = await loadHistory(sessionId);
        const lastAnswer = [...messages].reverse().find((message) => message.role === 'assistant');
        set({ messages, lastCitations: lastAnswer?.citations ?? [] });
        touchSession(sessionId, messages.length);
      } catch (error) {
        get().pushToast({
          tone: 'error',
          title: 'Could not load session history',
          description: toErrorMessage(error),
        });
      }
    },

    async clearActiveSession() {
      const { activeSessionId: sessionId, userId } = get();
      try {
        await api.clearHistory(sessionId, userId);
        storage.dropCitations(sessionId);
        set({
          messages: [],
          lastCitations: [],
          activeCitation: null,
          isInspectorOpen: false,
        });
        touchSession(sessionId, 0);
        get().pushToast({ tone: 'info', title: 'Session history cleared' });
      } catch (error) {
        get().pushToast({
          tone: 'error',
          title: 'Could not clear history',
          description: toErrorMessage(error),
        });
      }
    },

    messages: [],
    isAnswering: false,

    async askQuestion(question) {
      const trimmed = question.trim();
      if (!trimmed || get().isAnswering) return;

      const { activeSessionId: sessionId, userId, nChunks, maxHistory } = get();

      const userMessage: ChatMessage = {
        id: createId('msg'),
        role: 'user',
        content: trimmed,
        createdAt: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, userMessage],
        isAnswering: true,
        activity: 'retrieving',
        activeChunkCount: nChunks,
      }));
      titleSession(sessionId, trimmed);

      try {
        const response = await api.ask({
          session_id: sessionId,
          user_id: userId,
          question: trimmed,
          n_chunks: nChunks,
          max_history: maxHistory,
        });

        const assistantMessage: ChatMessage = {
          id: createId('msg'),
          role: 'assistant',
          content: response.answer,
          createdAt: Date.now(),
          citations: response.citations,
          model: response.model,
          isMock: response.is_mock,
          usage: response.usage,
          animate: true,
        };

        storage.saveCitations(sessionId, citationKey(response.answer), response.citations);

        set((state) => ({
          messages: [...state.messages, assistantMessage],
          lastCitations: response.citations,
          activeChunkCount: Math.max(response.citations.length, 1),
          isAnswering: false,
        }));
        touchSession(sessionId, get().messages.length);
      } catch (error) {
        const message = toErrorMessage(error, 'Answer generation failed.');
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: createId('msg'),
              role: 'assistant',
              content: message,
              createdAt: Date.now(),
              error: true,
              animate: false,
            },
          ],
          isAnswering: false,
        }));
        get().pushToast({ tone: 'error', title: 'Request failed', description: message });
      } finally {
        // Let the retrieval animation settle before the codex returns to rest.
        window.setTimeout(() => set({ activity: 'idle' }), 2600);
      }
    },

    nChunks: 3,
    maxHistory: 5,
    setNChunks: (value) => set({ nChunks: Math.min(10, Math.max(1, value)) }),
    setMaxHistory: (value) => set({ maxHistory: Math.min(20, Math.max(0, value)) }),

    activity: 'idle',
    activeChunkCount: 3,
    lastCitations: [],

    activeCitation: null,
    isInspectorOpen: false,
    openCitation: (citation) => set({ activeCitation: citation, isInspectorOpen: true }),
    closeInspector: () => set({ isInspectorOpen: false }),

    toasts: [],
    pushToast(toast) {
      const id = createId('toast');
      set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
      window.setTimeout(() => get().dismissToast(id), 6000);
    },
    dismissToast(id) {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    },

    async bootstrap() {
      await Promise.all([get().fetchHealth(), get().fetchDocuments()]);

      try {
        const messages = await loadHistory(get().activeSessionId);
        const lastAnswer = [...messages].reverse().find((message) => message.role === 'assistant');
        set({ messages, lastCitations: lastAnswer?.citations ?? [] });
      } catch {
        /* an unreachable backend is already surfaced by the health badge */
      }
    },
  };
});
