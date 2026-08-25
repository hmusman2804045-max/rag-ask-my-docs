import pytest
from app.embeddings.embedder import EmbeddingEngine, EmbeddedPayload, cosine_similarity
from app.chunking.text_chunker import ChunkData, ChunkingPayload


def test_embedding_dimensions():
    engine = EmbeddingEngine()
    vector = engine.embed_text("Testing vector embedding dimensions.")

    assert isinstance(vector, list)
    assert len(vector) == 384
    assert isinstance(vector[0], float)


def test_batch_texts_embedding():
    engine = EmbeddingEngine()
    texts = ["Document ingestion pipeline.", "Vector database storage."]
    vectors = engine.embed_texts(texts)

    assert len(vectors) == 2
    assert len(vectors[0]) == 384
    assert len(vectors[1]) == 384


def test_cosine_similarity_semantic_relevance():
    engine = EmbeddingEngine()

    v_rag1 = engine.embed_text("Retrieval Augmented Generation pipeline for document Q&A.")
    v_rag2 = engine.embed_text("RAG architecture for asking questions about PDF documents.")
    v_recipe = engine.embed_text("Baking chocolate chip cookies in an oven with butter.")

    sim_related = cosine_similarity(v_rag1, v_rag2)
    sim_unrelated = cosine_similarity(v_rag1, v_recipe)

    assert sim_related > 0.70
    assert sim_unrelated < 0.35
    assert sim_related > sim_unrelated


def test_embed_payload_conversion():
    engine = EmbeddingEngine()

    c1 = ChunkData(
        chunk_id="test_000",
        chunk_index=0,
        text="Phase 3 embedding pipeline implementation.",
        char_count=42,
        word_count=5,
        start_char=0,
        end_char=42,
        doc_name="test.pdf",
        page_numbers=[1]
    )

    chunk_payload = ChunkingPayload(
        doc_name="test.pdf",
        total_chunks=1,
        total_chars=42,
        avg_chunk_size=42.0,
        chunks=[c1]
    )

    embedded_payload = engine.embed_payload(chunk_payload)

    assert embedded_payload.doc_name == "test.pdf"
    assert embedded_payload.total_chunks == 1
    assert embedded_payload.vector_dim == 384
    assert len(embedded_payload.chunks[0].vector) == 384
