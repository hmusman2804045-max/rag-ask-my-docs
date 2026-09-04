import logging
from typing import Dict, Any, Optional
from app.embeddings.embedder import EmbeddingEngine
from app.storage.vector_store import VectorStore
from app.storage.memory_store import MemoryStore
from app.generation.prompt_builder import PromptBuilder
from app.generation.llm_engine import LLMEngine

logger = logging.getLogger(__name__)


class RAGPipeline:
    def __init__(
        self,
        vector_store: VectorStore,
        memory_store: MemoryStore,
        embedding_engine: Optional[EmbeddingEngine] = None,
        prompt_builder: Optional[PromptBuilder] = None,
        llm_engine: Optional[LLMEngine] = None
    ):
        self.vector_store = vector_store
        self.memory_store = memory_store
        self.embedding_engine = embedding_engine or EmbeddingEngine()
        self.prompt_builder = prompt_builder or PromptBuilder()
        self.llm_engine = llm_engine or LLMEngine()

    def ask(
        self,
        session_id: str,
        user_id: str,
        question: str,
        n_chunks: int = 3,
        max_history_messages: int = 5
    ) -> Dict[str, Any]:
        if not session_id or not str(session_id).strip():
            raise ValueError("session_id must be a non-empty string.")
        if not user_id or not str(user_id).strip():
            raise ValueError("user_id must be a non-empty string.")
        if not question or not str(question).strip():
            raise ValueError("Question cannot be empty.")

        clean_question = question.strip()
        if len(clean_question) > 2000:
            raise ValueError("Question length exceeds maximum allowed limit of 2000 characters.")

        history = self.memory_store.get_chat_history(
            session_id=session_id,
            user_id=user_id,
            limit=max_history_messages
        )

        query_vector = self.embedding_engine.embed_text(clean_question)
        retrieved_chunks = self.vector_store.query_similar(
            query_vector=query_vector,
            n_results=n_chunks
        )

        messages = self.prompt_builder.build_messages(
            question=clean_question,
            retrieved_chunks=retrieved_chunks,
            chat_history=history
        )

        llm_response = self.llm_engine.generate_answer(
            messages=messages,
            retrieved_chunks=retrieved_chunks
        )

        try:
            self.memory_store.save_message(
                session_id=session_id,
                user_id=user_id,
                role="user",
                content=clean_question
            )
            self.memory_store.save_message(
                session_id=session_id,
                user_id=user_id,
                role="assistant",
                content=llm_response["answer"]
            )
        except Exception as err:
            logger.error(f"Failed to persist chat message to MemoryStore: {err}")

        return {
            "question": clean_question,
            "answer": llm_response["answer"],
            "session_id": session_id,
            "user_id": user_id,
            "citations": llm_response["citations"],
            "retrieved_chunks_count": len(retrieved_chunks),
            "history_used_count": len(history),
            "model": llm_response["model"],
            "usage": llm_response["usage"],
            "is_mock": llm_response["is_mock"]
        }

