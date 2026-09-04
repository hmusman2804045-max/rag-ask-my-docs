import os
import pytest
from app.generation.llm_engine import LLMEngine


@pytest.fixture
def mock_llm_engine():
    return LLMEngine(api_key="invalid_mock_key")


def test_llm_engine_mock_mode_initialization(mock_llm_engine):
    assert mock_llm_engine.is_mock_mode is True


def test_llm_engine_extract_citations(mock_llm_engine):
    chunks = [
        {
            "chunk_id": "chunk_1",
            "similarity_score": 0.88,
            "metadata": {"doc_name": "report.pdf", "page_numbers": [3]}
        }
    ]
    citations = mock_llm_engine.extract_citations(chunks)
    assert len(citations) == 1
    assert citations[0]["doc_name"] == "report.pdf"
    assert citations[0]["page_numbers"] == [3]


def test_llm_engine_mock_out_of_context_answer(mock_llm_engine):
    messages = [
        {"role": "system", "content": "System instruction"},
        {"role": "user", "content": "What is the quantum speed of light?"}
    ]
    result = mock_llm_engine.generate_answer(messages, retrieved_chunks=[])

    assert result["is_mock"] is True
    assert result["answer"] == "I don't know based on the provided context."
    assert result["citations"] == []


def test_llm_engine_mock_in_context_answer(mock_llm_engine):
    messages = [
        {"role": "system", "content": "System instruction"},
        {"role": "user", "content": "What is AskMyDocs?"}
    ]
    chunks = [
        {
            "chunk_id": "chunk_1",
            "text": "AskMyDocs is a high performance RAG system.",
            "similarity_score": 0.92,
            "metadata": {"doc_name": "spec.pdf", "page_numbers": [1]}
        }
    ]
    result = mock_llm_engine.generate_answer(messages, retrieved_chunks=chunks)

    assert result["is_mock"] is True
    assert "Based on spec.pdf" in result["answer"]
    assert len(result["citations"]) == 1


def test_llm_engine_live_mode_if_key_present():
    key = os.getenv("GROQ_API_KEY", "")
    if key and key.startswith("gsk_"):
        engine = LLMEngine()
        assert engine.is_mock_mode is False
