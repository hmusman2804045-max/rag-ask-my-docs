import pytest
from app.embeddings.embedder import EmbeddingEngine, EmbeddedPayload, cosine_similarity
from app.chunking.text_chunker import ChunkData, ChunkingPayload


def test_embedding_dimensions():
    engine = EmbeddingEngine()
    text = "AskMyDocs processes technical documentation."
    vector = engine.embed_text(text)

    assert isinstance(vector, list)
    assert len(vector) == 384
    assert all(isinstance(x, float) for x in vector)


def test_batch_texts_embedding():
    engine = EmbeddingEngine()
    texts = [
        "First chunk of technical text.",
        "Second chunk of technical text.",
        "Third chunk of technical text."
    ]
    vectors = engine.embed_texts(texts)

    assert len(vectors) == 3
    for vec in vectors:
        assert len(vec) == 384


def test_cosine_similarity_semantic_relevance():
    engine = EmbeddingEngine()

    v_rag1 = engine.embed_text("Retrieval Augmented Generation pipeline for document Q&A.")
    v_rag2 = engine.embed_text("RAG architecture for asking questions about PDF documents.")
    v_recipe = engine.embed_text("Baking chocolate chip cookies in an oven with butter.")

    sim_related = cosine_similarity(v_rag1, v_rag2)
    sim_unrelated = cosine_similarity(v_rag1, v_recipe)

    assert sim_related > sim_unrelated
    assert sim_related > 0.30


def test_embed_payload_conversion():
    engine = EmbeddingEngine()

    chunk1 = ChunkData(
        chunk_id="doc_chunk_000",
        chunk_index=0,
        text="Sample paragraph for testing embedding payload.",
        char_count=47,
        word_count=6,
        start_char=0,
        end_char=47,
        doc_name="test.pdf",
        page_numbers=[1]
    )

    chunk_payload = ChunkingPayload(
        doc_name="test.pdf",
        total_chunks=1,
        total_chars=47,
        avg_chunk_size=47.0,
        chunks=[chunk1]
    )

    embedded_payload = engine.embed_payload(chunk_payload)

    assert isinstance(embedded_payload, EmbeddedPayload)
    assert embedded_payload.doc_name == "test.pdf"
    assert embedded_payload.total_chunks == 1
    assert len(embedded_payload.chunks) == 1

    e_chunk = embedded_payload.chunks[0]
    assert e_chunk.chunk_id == "doc_chunk_000"
    assert len(e_chunk.vector) == 384
