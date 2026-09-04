import logging
from fastapi import APIRouter, HTTPException, Request, Depends, Query, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.schemas import (
    ChatAskRequest,
    ChatAskResponse,
    CitationModel,
    ChatHistoryResponse,
    ChatMessageModel
)
from app.api.dependencies import get_rag_pipeline, get_memory_store
from app.generation.rag_pipeline import RAGPipeline
from app.storage.memory_store import MemoryStore

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


@router.post(
    "/ask",
    response_model=ChatAskResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask Question with RAG Context & Memory"
)
@limiter.limit("15/minute")
async def ask_question(
    request: Request,
    payload: ChatAskRequest,
    rag_pipeline: RAGPipeline = Depends(get_rag_pipeline)
) -> ChatAskResponse:
    """Submits a question to the RAG pipeline. Retrieves relevant document context & chat history, calls Groq LLM, saves conversation turn, and returns answer with source citations."""
    try:
        res = rag_pipeline.ask(
            session_id=payload.session_id,
            user_id=payload.user_id,
            question=payload.question,
            n_chunks=payload.n_chunks,
            max_history_messages=payload.max_history
        )

        citations = [
            CitationModel(
                chunk_id=c["chunk_id"],
                doc_name=c["doc_name"],
                page_numbers=c["page_numbers"],
                similarity_score=c["similarity_score"]
            )
            for c in res.get("citations", [])
        ]

        return ChatAskResponse(
            question=res["question"],
            answer=res["answer"],
            session_id=res["session_id"],
            user_id=res["user_id"],
            citations=citations,
            retrieved_chunks_count=res["retrieved_chunks_count"],
            history_used_count=res["history_used_count"],
            model=res["model"],
            usage=res["usage"],
            is_mock=res["is_mock"]
        )

    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        logger.error(f"Error handling /chat/ask for session '{payload.session_id}': {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during answer generation: {err}"
        )


@router.get(
    "/history/{session_id}",
    response_model=ChatHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Session Chat History"
)
def get_chat_history(
    session_id: str,
    user_id: str = Query(..., description="Unique user identifier"),
    limit: int = Query(default=20, ge=1, le=100, description="Max history items"),
    memory_store: MemoryStore = Depends(get_memory_store)
) -> ChatHistoryResponse:
    """Fetches stored conversation turns for a session from MemoryStore."""
    if not session_id or not session_id.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="session_id cannot be empty.")
    if not user_id or not user_id.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id query parameter is required.")

    history_items = memory_store.get_chat_history(session_id=session_id, user_id=user_id, limit=limit)
    messages = [
        ChatMessageModel(
            role=msg.get("role", "user"),
            content=msg.get("content", ""),
            timestamp=msg.get("timestamp")
        )
        for msg in history_items
    ]

    return ChatHistoryResponse(
        session_id=session_id,
        user_id=user_id,
        message_count=len(messages),
        messages=messages
    )


@router.delete(
    "/history/{session_id}",
    status_code=status.HTTP_200_OK,
    summary="Clear Session Chat History"
)
def clear_chat_history(
    session_id: str,
    user_id: str = Query(..., description="Unique user identifier"),
    memory_store: MemoryStore = Depends(get_memory_store)
) -> dict:
    """Clears all conversation turns for a given session."""
    if not session_id or not session_id.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="session_id cannot be empty.")
    if not user_id or not user_id.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id query parameter is required.")

    deleted_count = memory_store.clear_history(session_id=session_id, user_id=user_id)
    return {
        "status": "success",
        "session_id": session_id,
        "user_id": user_id,
        "deleted_messages_count": deleted_count
    }
