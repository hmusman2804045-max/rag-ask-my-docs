import pytest
from app.embeddings.embedder import EmbeddedPayload, EmbeddedChunk
from app.storage.vector_store import VectorStore


@pytest.fixture
def test_vector_store():
    store = VectorStore(mongo_uri=None, collection_name="test_doc_chunks")
    store.reset_collection()
    yield store
    store.reset_collection()


def test_vector_store_initialization(test_vector_store):
    stats = test_vector_store.get_stats()
    assert stats["collection_name"] == "test_doc_chunks"
    assert stats["total_chunks"] == 0
    health = test_vector_store.get_health()
    assert "vector_store_connected" in health


def test_add_and_query_payload(test_vector_store):
    vec1 = [1.0] + [0.0] * 383
    vec2 = [0.0] + [1.0] * 383

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
        vector=vec1
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
        vector=vec2
    )

    payload = EmbeddedPayload(
        doc_name="spec.pdf",
        total_chunks=2,
        vector_dim=384,
        chunks=[chunk1, chunk2]
    )

    added = test_vector_store.add_embedded_payload(payload)
    assert added == 2

    stats = test_vector_store.get_stats()
    assert stats["total_chunks"] == 2

    query_vec = [0.0] + [1.0] * 383
    results = test_vector_store.query_similar(query_vec, n_results=2)

    assert len(results) == 2
    assert results[0]["chunk_id"] == "doc1_chunk_001"
    assert results[0]["metadata"]["page_numbers"] == [2]
    assert results[0]["similarity_score"] > results[1]["similarity_score"]


def test_list_documents(test_vector_store):
    chunk1 = EmbeddedChunk(
        chunk_id="doc1_chunk_0",
        chunk_index=0,
        text="Spec page one text",
        char_count=18,
        word_count=4,
        start_char=0,
        end_char=18,
        doc_name="spec.pdf",
        page_numbers=[1, 2],
        vector=[0.5] * 384
    )
    payload = EmbeddedPayload(
        doc_name="spec.pdf",
        total_chunks=1,
        vector_dim=384,
        chunks=[chunk1]
    )
    test_vector_store.add_embedded_payload(payload)

    docs = test_vector_store.list_documents()
    assert len(docs) == 1
    assert docs[0]["doc_name"] == "spec.pdf"
    assert docs[0]["page_count"] == 2
    assert docs[0]["chunk_count"] == 1


def test_delete_document_chunks(test_vector_store):
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
    test_vector_store.add_embedded_payload(payload)

    assert test_vector_store.get_stats()["total_chunks"] == 1

    deleted_count = test_vector_store.delete_document("docA.pdf")
    assert deleted_count == 1
    assert test_vector_store.get_stats()["total_chunks"] == 0
