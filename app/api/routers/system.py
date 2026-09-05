import logging
from fastapi import APIRouter, Depends
from app.api.schemas import HealthResponse
from app.api.dependencies import get_memory_store, get_vector_store, get_llm_engine
from app.storage.memory_store import MemoryStore
from app.storage.vector_store import VectorStore
from app.generation.llm_engine import LLMEngine, GROQ_AVAILABLE

logger = logging.getLogger(__name__)
router = APIRouter(tags=["System"])


@router.get("/health", response_model=HealthResponse, summary="System Health Check")
@router.get("/api/v1/system/health", response_model=HealthResponse, summary="System Health Check Alias")
def get_system_health(
    memory_store: MemoryStore = Depends(get_memory_store),
    vector_store: VectorStore = Depends(get_vector_store),
    llm_engine: LLMEngine = Depends(get_llm_engine)
) -> HealthResponse:
    """Checks operational readiness of MongoDB, Vector Store, and Groq LLM integration."""
    mongo_connected = memory_store.is_connected
    stats = vector_store.get_stats()
    vector_count = stats.get("total_chunks", 0)
    backend_name = stats.get("backend", "vector_store")
    chroma_status = f"healthy ({vector_count} vectors indexed in {backend_name})"

    return HealthResponse(
        status="healthy",
        mongodb_connected=mongo_connected,
        chroma_status=chroma_status,
        groq_available=GROQ_AVAILABLE,
        is_mock_mode=llm_engine.is_mock_mode
    )
