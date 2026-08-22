import pytest
from app.chunking.text_chunker import TextChunker, ChunkingPayload
from app.ingestion.pdf_extractor import DocumentPayload, PageData


def test_invalid_overlap_initialization():
    with pytest.raises(ValueError) as exc_info:
        TextChunker(chunk_size=500, chunk_overlap=500)
    assert "must be strictly smaller" in str(exc_info.value)


def test_empty_text_chunking():
    chunker = TextChunker()
    payload = chunker.chunk_text("", doc_name="empty.pdf")
    assert payload.total_chunks == 0
    assert payload.total_chars == 0
    assert len(payload.chunks) == 0


def test_short_text_single_chunk():
    short_text = "This is a short single paragraph document for RAG testing."
    chunker = TextChunker(chunk_size=800, chunk_overlap=150)
    payload = chunker.chunk_text(short_text, doc_name="short.pdf")

    assert payload.total_chunks == 1
    assert payload.chunks[0].chunk_id == "short_pdf_chunk_000"
    assert payload.chunks[0].text == short_text
    assert payload.chunks[0].word_count == len(short_text.split())
    assert payload.chunks[0].page_numbers == [1]


def test_multi_chunk_overlap():
    paragraphs = [
        f"Paragraph {i}: AskMyDocs system processes long technical documents into distinct vector representations. "
        f"Retrieval accuracy depends heavily on choosing appropriate chunk sizes and overlap thresholds."
        for i in range(1, 15)
    ]
    large_text = "\n\n".join(paragraphs)

    chunker = TextChunker(chunk_size=300, chunk_overlap=80)
    payload = chunker.chunk_text(large_text, doc_name="large_doc.pdf")

    assert payload.total_chunks > 1

    for k in range(len(payload.chunks) - 1):
        c1 = payload.chunks[k]
        c2 = payload.chunks[k+1]
        assert c1.chunk_index == k
        assert c2.chunk_index == k + 1
        assert c1.chunk_id == f"large_doc_pdf_chunk_{k:03d}"

        words_c1 = set(c1.text.split()[-10:])
        words_c2 = set(c2.text.split()[:10])
        common_words = words_c1.intersection(words_c2)
        assert len(common_words) > 0, f"Chunk {k} and Chunk {k+1} should share overlapping boundary text."


def test_chunk_document_payload_with_pages():
    p1 = PageData(page_num=1, text="Page 1 Content: Overview of RAG system design.", char_count=46)
    p2 = PageData(page_num=2, text="Page 2 Content: Detailed vector database storage in Chroma DB.", char_count=63)
    p3 = PageData(page_num=3, text="Page 3 Content: LLM generation via Groq API.", char_count=44)

    doc_payload = DocumentPayload(
        filename="rag_spec.pdf",
        total_pages=3,
        total_chars=157,
        full_text=f"{p1.text}\n\n{p2.text}\n\n{p3.text}",
        pages=[p1, p2, p3]
    )

    chunker = TextChunker(chunk_size=80, chunk_overlap=20)
    chunking_payload = chunker.chunk_document_payload(doc_payload)

    assert chunking_payload.doc_name == "rag_spec.pdf"
    assert chunking_payload.total_chunks >= 2

    assert 1 in chunking_payload.chunks[0].page_numbers
