import pytest
from app.chunking.langchain_chunker import LangChainChunker, chunk_document_payload_langchain
from app.ingestion.pdf_extractor import DocumentPayload, PageData


def test_invalid_langchain_overlap_initialization():
    with pytest.raises(ValueError) as exc_info:
        LangChainChunker(chunk_size=500, chunk_overlap=500)
    assert "must be strictly smaller" in str(exc_info.value)


def test_empty_langchain_text_chunking():
    chunker = LangChainChunker()
    payload = chunker.chunk_text("", doc_name="empty.pdf")
    assert payload.total_chunks == 0
    assert payload.total_chars == 0
    assert len(payload.chunks) == 0


def test_short_text_langchain_single_chunk():
    short_text = "This is a short text document for testing LangChain text splitter."
    chunker = LangChainChunker(chunk_size=800, chunk_overlap=150)
    payload = chunker.chunk_text(short_text, doc_name="short_lc.pdf")

    assert payload.total_chunks == 1
    assert payload.chunks[0].chunk_id == "short_lc_pdf_langchain_chunk_000"
    assert payload.chunks[0].text == short_text
    assert payload.chunks[0].word_count == len(short_text.split())
    assert payload.chunks[0].page_numbers == [1]


def test_chunk_document_payload_langchain_function():
    p1 = PageData(page_num=1, text="Page 1: LangChain RecursiveCharacterTextSplitter testing.", char_count=57)
    p2 = PageData(page_num=2, text="Page 2: Standardizing dataclass payload output format.", char_count=53)

    doc_payload = DocumentPayload(
        filename="langchain_spec.pdf",
        total_pages=2,
        total_chars=112,
        full_text=f"{p1.text}\n\n{p2.text}",
        pages=[p1, p2]
    )

    chunking_payload = chunk_document_payload_langchain(doc_payload, chunk_size=80, chunk_overlap=20)

    assert chunking_payload.doc_name == "langchain_spec.pdf"
    assert chunking_payload.total_chunks >= 1
    assert chunking_payload.chunks[0].doc_name == "langchain_spec.pdf"
