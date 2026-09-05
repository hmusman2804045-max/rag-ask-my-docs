import axios, { AxiosError } from 'axios';
import type {
  ChatAskRequest,
  ChatAskResponse,
  ChatHistoryResponse,
  DocumentDeleteResponse,
  DocumentListResponse,
  DocumentUploadResponse,
  HealthResponse,
} from '@/types';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
});

/** FastAPI returns errors as `{ detail: string | ValidationError[] }`. */
export function toErrorMessage(error: unknown, fallback = 'Request failed.'): string {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') return 'The backend took too long to respond.';
    if (!error.response) return `Cannot reach the API at ${API_BASE_URL}. Is the server running?`;

    if (error.response.status === 429) {
      return 'Rate limit reached. Wait a moment before trying again.';
    }

    const detail = (error.response.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      if (first?.msg) return first.msg;
    }
    return `${error.response.status} ${error.response.statusText}`;
  }

  if (error instanceof Error) return error.message;
  return fallback;
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const { data } = await client.get<HealthResponse>('/health');
    return data;
  },

  async uploadDocument(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<DocumentUploadResponse> {
    const form = new FormData();
    form.append('file', file);

    const { data } = await client.post<DocumentUploadResponse>(
      '/api/v1/documents/upload',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (!onProgress) return;
          const total = event.total ?? file.size;
          onProgress(total > 0 ? Math.round((event.loaded / total) * 100) : 0);
        },
      },
    );
    return data;
  },

  async listDocuments(): Promise<DocumentListResponse> {
    const { data } = await client.get<DocumentListResponse>('/api/v1/documents');
    return data;
  },

  async deleteDocument(docName: string): Promise<DocumentDeleteResponse> {
    const { data } = await client.delete<DocumentDeleteResponse>(
      `/api/v1/documents/${encodeURIComponent(docName)}`,
    );
    return data;
  },

  async ask(payload: ChatAskRequest): Promise<ChatAskResponse> {
    const { data } = await client.post<ChatAskResponse>('/api/v1/chat/ask', payload);
    return data;
  },

  async getHistory(
    sessionId: string,
    userId: string,
    limit = 50,
  ): Promise<ChatHistoryResponse> {
    const { data } = await client.get<ChatHistoryResponse>(
      `/api/v1/chat/history/${encodeURIComponent(sessionId)}`,
      { params: { user_id: userId, limit } },
    );
    return data;
  },

  async clearHistory(sessionId: string, userId: string): Promise<void> {
    await client.delete(`/api/v1/chat/history/${encodeURIComponent(sessionId)}`, {
      params: { user_id: userId },
    });
  },
};
