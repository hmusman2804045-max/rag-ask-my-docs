import tempfile
import pytest
from app.storage.vector_store import VectorStore
from app.storage.memory_store import MemoryStore
from app.generation.rag_pipeline import RAGPipeline
from app.embeddings.embedder import EmbeddedPayload, EmbeddedChunk


@pytest.fixture
def rag_pipeline():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmpdir:
        v_store = VectorStore(persist_dir=tmpdir, collection_name="test_rag_col")
        m_store = MemoryStore(mongo_uri="")

        chunk = EmbeddedChunk(
            chunk_id="chunk_001",
            chunk_index=0,
            text="AskMyDocs uses PyMuPDF for secure PDF text extraction.",
            char_count=54,
            word_count=8,
            start_char=0,
            end_char=54,
            doc_name="architecture.pdf",
            page_numbers=[1],
            vector=[0.1] * 384
        )
        payload = EmbeddedPayload(
            doc_name="architecture.pdf",
            total_chunks=1,
            vector_dim=384,
            chunks=[chunk]
        )
        v_store.add_embedded_payload(payload)

        pipeline = RAGPipeline(vector_store=v_store, memory_store=m_store)
        yield pipeline


def test_rag_pipeline_end_to_end_question(rag_pipeline):
    res = rag_pipeline.ask(
        session_id="session_test_1",
        user_id="user_1",
        question="How does AskMyDocs extract text?"
    )

    assert res["question"] == "How does AskMyDocs extract text?"
    assert "answer" in res
    assert res["retrieved_chunks_count"] == 1
    assert len(res["citations"]) == 1

    history = rag_pipeline.memory_store.get_chat_history("session_test_1", "user_1")
    assert len(history) == 2
    assert history[0]["role"] == "user"
    assert history[1]["role"] == "assistant"


def test_rag_pipeline_multi_turn_history(rag_pipeline):
    rag_pipeline.ask("sess_multi", "user_m", "First question?")
    res2 = rag_pipeline.ask("sess_multi", "user_m", "Follow-up question?")

    assert res2["history_used_count"] == 2
    history = rag_pipeline.memory_store.get_chat_history("sess_multi", "user_m")
    assert len(history) == 4


def test_rag_pipeline_invalid_inputs(rag_pipeline):
    with pytest.raises(ValueError, match="Question cannot be empty"):
        rag_pipeline.ask("s1", "u1", "   ")

    with pytest.raises(ValueError, match="session_id must be a non-empty string"):
        rag_pipeline.ask("", "u1", "Valid question")

    with pytest.raises(ValueError, match="Question length exceeds maximum"):
        rag_pipeline.ask("s1", "u1", "A" * 2005)


def test_rag_pipeline_memory_save_failure_resilience(rag_pipeline, monkeypatch):
    def failing_save_message(*args, **kwargs):
        raise RuntimeError("MongoDB connection timeout")

    monkeypatch.setattr(rag_pipeline.memory_store, "save_message", failing_save_message)

    res = rag_pipeline.ask("sess_fail", "user_fail", "Will this fail gracefully?")
    assert res["question"] == "Will this fail gracefully?"
    assert "answer" in res

