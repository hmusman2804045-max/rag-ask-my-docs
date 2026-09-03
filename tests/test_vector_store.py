import tempfile
import pytest
from app.embeddings.embedder import EmbeddedPayload, EmbeddedChunk
from app.storage.vector_store import VectorStore


@pytest.fixture
def temp_vector_store():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmpdir:
        store = VectorStore(persist_dir=tmpdir, collection_name="test_collection")
        yield store


def test_vector_store_initialization(temp_vector_store):
    stats = temp_vector_store.get_stats()
    assert stats["collection_name"] == "test_collection"
    assert stats["total_chunks"] == 0


def test_add_and_query_payload(temp_vector_store):
    chunk1 = EmbeddedChunk(
        chunk_id="doc1_chunk_000",
        chunk_index=0,
        text="The quick brown fox jumps over the lazy dog.",
        char_count=44,
        word_count=9,
        start_char=0,
        end_char=44,
        doc_name="spec.pdf",
        page_numbers=[1],
        vector=[0.1] * 384
    )
    chunk2 = EmbeddedChunk(
        chunk_id="doc1_chunk_001",
        chunk_index=1,
        text="Artificial intelligence and machine learning transform industries.",
        char_count=65,
        word_count=8,
        start_char=45,
        end_char=110,
        doc_name="spec.pdf",
        page_numbers=[2],
        vector=[0.9] * 384
    )

    payload = EmbeddedPayload(
        doc_name="spec.pdf",
        total_chunks=2,
        vector_dim=384,
        chunks=[chunk1, chunk2]
    )

    added = temp_vector_store.add_embedded_payload(payload)
    assert added == 2

    stats = temp_vector_store.get_stats()
    assert stats["total_chunks"] == 2

    query_vec = [0.9] * 384
    results = temp_vector_store.query_similar(query_vec, n_results=2)

    assert len(results) == 2
    assert results[0]["chunk_id"] == "doc1_chunk_001"
    assert results[0]["metadata"]["page_numbers"] == [2]


def test_delete_document_chunks(temp_vector_store):
    chunk1 = EmbeddedChunk(
        chunk_id="docA_chunk_0",
        chunk_index=0,
        text="Document A text content.",
        char_count=24,
        word_count=4,
        start_char=0,
        end_char=24,
        doc_name="docA.pdf",
        page_numbers=[1],
        vector=[0.2] * 384
    )
    payload = EmbeddedPayload(
        doc_name="docA.pdf",
        total_chunks=1,
        vector_dim=384,
        chunks=[chunk1]
    )
    temp_vector_store.add_embedded_payload(payload)

    assert temp_vector_store.get_stats()["total_chunks"] == 1

    deleted_count = temp_vector_store.delete_document("docA.pdf")
    assert deleted_count == 1
    assert temp_vector_store.get_stats()["total_chunks"] == 0
