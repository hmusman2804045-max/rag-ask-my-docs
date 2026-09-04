import pytest
from app.generation.llm_engine import LLMEngine


@pytest.fixture
def llm_engine():
    return LLMEngine(api_key="")


def test_llm_engine_mock_mode_initialization(llm_engine):
    assert llm_engine.is_mock_mode is True


def test_llm_engine_extract_citations(llm_engine):
    chunks = [
        {
            "chunk_id": "chunk_1",
            "similarity_score": 0.88,
            "metadata": {"doc_name": "report.pdf", "page_numbers": [3]}
        }
    ]
    citations = llm_engine.extract_citations(chunks)
    assert len(citations) == 1
    assert citations[0]["doc_name"] == "report.pdf"
    assert citations[0]["page_numbers"] == [3]


def test_llm_engine_mock_out_of_context_answer(llm_engine):
    messages = [
        {"role": "system", "content": "System instruction"},
        {"role": "user", "content": "What is the quantum speed of light?"}
    ]
    result = llm_engine.generate_answer(messages, retrieved_chunks=[])

    assert result["is_mock"] is True
    assert result["answer"] == "I don't know based on the provided context."
    assert result["citations"] == []


def test_llm_engine_mock_in_context_answer(llm_engine):
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
    result = llm_engine.generate_answer(messages, retrieved_chunks=chunks)

    assert result["is_mock"] is True
    assert "Based on spec.pdf" in result["answer"]
    assert len(result["citations"]) == 1
