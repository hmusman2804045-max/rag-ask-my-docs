import os
import logging
from typing import Optional
from app.ingestion.pdf_extractor import PDFExtractor
from app.chunking.langchain_chunker import LangChainChunker
from app.embeddings.embedder import EmbeddingEngine
from app.storage.vector_store import VectorStore
from app.storage.memory_store import MemoryStore
from app.generation.prompt_builder import PromptBuilder
from app.generation.llm_engine import LLMEngine
from app.generation.rag_pipeline import RAGPipeline

logger = logging.getLogger(__name__)

# Global singleton container
_vector_store: Optional[VectorStore] = None
_memory_store: Optional[MemoryStore] = None
_embedding_engine: Optional[EmbeddingEngine] = None
_pdf_extractor: Optional[PDFExtractor] = None
_chunker: Optional[LangChainChunker] = None
_prompt_builder: Optional[PromptBuilder] = None
_llm_engine: Optional[LLMEngine] = None
_rag_pipeline: Optional[RAGPipeline] = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        mongo_uri = os.getenv("MONGODB_URI", "")
        db_name = os.getenv("MONGODB_DB_NAME", "askmydocs")
        collection_name = os.getenv("VECTOR_COLLECTION_NAME", "document_chunks")
        _vector_store = VectorStore(
            mongo_uri=mongo_uri,
            db_name=db_name,
            collection_name=collection_name
        )
    return _vector_store


def get_memory_store() -> MemoryStore:
    global _memory_store
    if _memory_store is None:
        mongo_uri = os.getenv("MONGODB_URI", "")
        db_name = os.getenv("MONGODB_DB_NAME", "askmydocs_db")
        _memory_store = MemoryStore(mongo_uri=mongo_uri, db_name=db_name)
    return _memory_store


def get_embedding_engine() -> EmbeddingEngine:
    global _embedding_engine
    if _embedding_engine is None:
        _embedding_engine = EmbeddingEngine()
    return _embedding_engine


def get_pdf_extractor() -> PDFExtractor:
    global _pdf_extractor
    if _pdf_extractor is None:
        _pdf_extractor = PDFExtractor()
    return _pdf_extractor


def get_chunker() -> LangChainChunker:
    global _chunker
    if _chunker is None:
        _chunker = LangChainChunker(chunk_size=1000, chunk_overlap=200)
    return _chunker


def get_prompt_builder() -> PromptBuilder:
    global _prompt_builder
    if _prompt_builder is None:
        _prompt_builder = PromptBuilder()
    return _prompt_builder


def get_llm_engine() -> LLMEngine:
    global _llm_engine
    if _llm_engine is None:
        _llm_engine = LLMEngine()
    return _llm_engine


def get_rag_pipeline() -> RAGPipeline:
    global _rag_pipeline
    if _rag_pipeline is None:
        _rag_pipeline = RAGPipeline(
            vector_store=get_vector_store(),
            memory_store=get_memory_store(),
            embedding_engine=get_embedding_engine(),
            prompt_builder=get_prompt_builder(),
            llm_engine=get_llm_engine()
        )
    return _rag_pipeline
