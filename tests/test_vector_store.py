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
        doc_name="spec.pdf",
        text="The quick brown fox jumps over the lazy dog.",
        page_numbers=[1],
        start_char=0,
        end_char=44,
        embedding=[0.1] * 384
    )
    chunk2 = EmbeddedChunk(
        chunk_id="doc1_chunk_001",
        doc_name="spec.pdf",
        text="Artificial intelligence and machine learning transform industries.",
        page_numbers=[2],
        start_char=45,
        end_char=110,
        embedding=[0.9] * 384
    )

    payload = EmbeddedPayload(
        doc_name="spec.pdf",
        total_chunks=2,
        embedding_model="all-MiniLM-L6-v2",
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
        doc_name="docA.pdf",
        text="Document A text content.",
        page_numbers=[1],
        start_char=0,
        end_char=24,
        embedding=[0.2] * 384
    )
    payload = EmbeddedPayload(
        doc_name="docA.pdf",
        total_chunks=1,
        embedding_model="all-MiniLM-L6-v2",
        chunks=[chunk1]
    )
    temp_vector_store.add_embedded_payload(payload)

    assert temp_vector_store.get_stats()["total_chunks"] == 1

    deleted_count = temp_vector_store.delete_document("docA.pdf")
    assert deleted_count == 1
    assert temp_vector_store.get_stats()["total_chunks"] == 0
