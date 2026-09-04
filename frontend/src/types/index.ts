/** Mirrors `app/api/schemas.py` on the FastAPI backend. */

export interface HealthResponse {
  status: string;
  mongodb_connected: boolean;
  chroma_status: string;
  groq_available: boolean;
  is_mock_mode: boolean;
}

export interface DocumentUploadResponse {
  status: string;
  doc_name: string;
  page_count: number;
  chunk_count: number;
  char_count: number;
  execution_time_ms: number;
}

export interface IndexedDocument {
  doc_name: string;
  page_count: number;
  chunk_count: number;
  char_count: number;
  word_count: number;
}

export interface DocumentListResponse {
  total_documents: number;
  total_chunks: number;
  documents: IndexedDocument[];
}

export interface DocumentDeleteResponse {
  status: string;
  doc_name: string;
  deleted_chunks_count: number;
}

export interface Citation {
  chunk_id: string;
  doc_name: string;
  page_numbers: number[];
  similarity_score: number;
  text_snippet: string;
}

export interface ChatAskRequest {
  session_id: string;
  user_id: string;
  question: string;
  n_chunks: number;
  max_history: number;
}

export interface ChatAskResponse {
  question: string;
  answer: string;
  session_id: string;
  user_id: string;
  citations: Citation[];
  retrieved_chunks_count: number;
  history_used_count: number;
  model: string;
  usage: Record<string, number>;
  is_mock: boolean;
}

export interface ChatHistoryResponse {
  session_id: string;
  user_id: string;
  message_count: number;
  messages: { role: string; content: string; timestamp?: string | null }[];
}

/** Client-side view models. */

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  citations?: Citation[];
  model?: string;
  isMock?: boolean;
  usage?: Record<string, number>;
  /** Assistant messages stream in on arrival; replayed history does not. */
  animate?: boolean;
  error?: boolean;
}

export interface SessionSummary {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

export type UploadPhase = 'idle' | 'uploading' | 'indexing' | 'success' | 'error';

export interface UploadState {
  phase: UploadPhase;
  fileName: string | null;
  progress: number;
  result: DocumentUploadResponse | null;
  error: string | null;
}

/** Drives the 3D canvas: the scene reacts to pipeline activity. */
export type CodexActivity = 'idle' | 'ingesting' | 'retrieving';
