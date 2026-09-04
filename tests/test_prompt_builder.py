import pytest
from app.generation.prompt_builder import PromptBuilder


@pytest.fixture
def prompt_builder():
    return PromptBuilder()


def test_prompt_builder_default_system_prompt(prompt_builder):
    assert "AskMyDocs AI" in prompt_builder.system_prompt
    assert "ONLY the provided document context" in prompt_builder.system_prompt


def test_prompt_builder_build_context_block(prompt_builder):
    chunks = [
        {
            "chunk_id": "c1",
            "text": "AskMyDocs ingests PDF documents.",
            "similarity_score": 0.85,
            "metadata": {"doc_name": "spec.pdf", "page_numbers": [1]}
        }
    ]
    block = prompt_builder.build_context_block(chunks)
    assert "CHUNK #1" in block
    assert "spec.pdf" in block
    assert "AskMyDocs ingests PDF documents." in block


def test_prompt_builder_build_messages_structure(prompt_builder):
    chunks = [
        {
            "chunk_id": "c1",
            "text": "Sample text",
            "similarity_score": 0.9,
            "metadata": {"doc_name": "doc1.pdf", "page_numbers": [2]}
        }
    ]
    history = [
        {"role": "user", "content": "Hi"},
        {"role": "assistant", "content": "Hello!"}
    ]
    messages = prompt_builder.build_messages("What is this doc about?", chunks, history)

    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"
    assert "RECENT CONVERSATION HISTORY" in messages[1]["content"]
    assert "RETRIEVED DOCUMENT CONTEXT" in messages[1]["content"]
    assert "USER QUESTION" in messages[1]["content"]
