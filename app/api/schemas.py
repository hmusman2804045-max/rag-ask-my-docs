from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DocumentUploadResponse(BaseModel):
    status: str = Field(..., description="Status of the document ingestion operation")
    doc_name: str = Field(..., description="Name of the processed PDF document")
    page_count: int = Field(..., description="Total pages extracted from the PDF")
    chunk_count: int = Field(..., description="Total text chunks generated and indexed")
    char_count: int = Field(..., description="Total character count extracted")
    execution_time_ms: float = Field(..., description="Processing time in milliseconds")


class ChatAskRequest(BaseModel):
    session_id: str = Field(..., description="Unique conversation session identifier", json_schema_extra={"example": "session_123"})
    user_id: str = Field(..., description="Unique user identifier", json_schema_extra={"example": "user_456"})
    question: str = Field(..., description="User question to answer", json_schema_extra={"example": "What is AskMyDocs?"})
    n_chunks: int = Field(default=3, ge=1, le=10, description="Number of context chunks to retrieve")
    max_history: int = Field(default=5, ge=0, le=20, description="Maximum conversation history turns to include")



class CitationModel(BaseModel):
    chunk_id: str
    doc_name: str
    page_numbers: List[int]
    similarity_score: float


class ChatAskResponse(BaseModel):
    question: str
    answer: str
    session_id: str
    user_id: str
    citations: List[CitationModel]
    retrieved_chunks_count: int
    history_used_count: int
    model: str
    usage: Dict[str, int]
    is_mock: bool


class ChatMessageModel(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None


class ChatHistoryResponse(BaseModel):
    session_id: str
    user_id: str
    message_count: int
    messages: List[ChatMessageModel]


class HealthResponse(BaseModel):
    status: str
    mongodb_connected: bool
    chroma_status: str
    groq_available: bool
    is_mock_mode: bool
