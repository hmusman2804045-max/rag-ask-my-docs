import tempfile
import pytest
from app.storage.vector_store import VectorStore
from app.embeddings.embedder import EmbeddedPayload, EmbeddedChunk


@pytest.fixture
def temp_vector_store():
    with tempfile.TemporaryDirectory() as tmpdir:
        store = VectorStore(persist_dir=tmpdir, collection_name="test_chunks")
        yield store


def test_vector_store_initialization(temp_vector_store):
    stats = temp_vector_store.get_stats()
    assert stats["collection_name"] == "test_chunks"
    assert stats["total_chunks"] == 0


def test_add_and_query_payload(temp_vector_store):
    chunk1 = EmbeddedChunk(
        chunk_id="doc1_chunk_000",
        chunk_index=0,
        text="PyMuPDF handles PDF document ingestion.",
        char_count=39,
        word_count=5,
        start_char=0,
        end_char=39,
        doc_name="doc1.pdf",
        page_numbers=[1],
        vector=[0.1] * 384
    )

    chunk2 = EmbeddedChunk(
        chunk_id="doc1_chunk_001",
        chunk_index=1,
        text="Chroma DB persists vector embeddings on disk.",
        char_count=45,
        word_count=7,
        start_char=40,
        end_char=85,
        doc_name="doc1.pdf",
        page_numbers=[1, 2],
        vector=[0.9] * 384
    )

    payload = EmbeddedPayload(
        doc_name="doc1.pdf",
        total_chunks=2,
        vector_dim=384,
        chunks=[chunk1, chunk2]
    )

    added_count = temp_vector_store.add_embedded_payload(payload)
    assert added_count == 2
    assert temp_vector_store.get_stats()["total_chunks"] == 2

    query_vec = [0.9] * 384
    results = temp_vector_store.query_similar(query_vec, n_results=2)

    assert len(results) == 2
    assert results[0]["chunk_id"] == "doc1_chunk_001"
    assert results[0]["metadata"]["page_numbers"] == [1, 2]
    assert results[0]["similarity_score"] > 0.90


def test_delete_document_chunks(temp_vector_store):
    chunk = EmbeddedChunk(
        chunk_id="doc2_chunk_000",
        chunk_index=0,
        text="Testing document deletion.",
        char_count=26,
        word_count=3,
        start_char=0,
        end_char=26,
        doc_name="doc2.pdf",
        page_numbers=[1],
        vector=[0.5] * 384
    )

    payload = EmbeddedPayload(doc_name="doc2.pdf", total_chunks=1, vector_dim=384, chunks=[chunk])
    temp_vector_store.add_embedded_payload(payload)

    assert temp_vector_store.get_stats()["total_chunks"] == 1

    deleted_count = temp_vector_store.delete_document("doc2.pdf")
    assert deleted_count == 1
    assert temp_vector_store.get_stats()["total_chunks"] == 0
