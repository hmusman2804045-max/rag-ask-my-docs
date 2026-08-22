import pymupdf as fitz
import pytest

from app.ingestion.pdf_extractor import PDFExtractor
from app.ingestion.exceptions import (
    InvalidPDFFormatError,
    PDFSizeLimitExceededError,
    PDFPageLimitExceededError,
    PDFEncryptedError
)


def create_sample_pdf_bytes(text_content: str = "Hello AskMyDocs RAG System!", pages: int = 1) -> bytes:
    doc = fitz.open()
    for i in range(pages):
        page = doc.new_page()
        page.insert_text((50, 50), f"Page {i+1}: {text_content}")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_valid_pdf_extraction():
    pdf_bytes = create_sample_pdf_bytes("Testing Phase 1 secure ingestion.", pages=2)
    extractor = PDFExtractor(max_size_mb=5.0, max_pages=10)

    payload = extractor.extract_from_bytes(pdf_bytes, filename="test_sample.pdf")

    assert payload.filename == "test_sample.pdf"
    assert payload.total_pages == 2
    assert "Testing Phase 1 secure ingestion." in payload.full_text
    assert len(payload.pages) == 2
    assert payload.pages[0].page_num == 1
    assert payload.pages[1].page_num == 2


def test_invalid_magic_bytes():
    fake_bytes = b"This is a plain text file, not a PDF."
    extractor = PDFExtractor()

    with pytest.raises(InvalidPDFFormatError) as exc_info:
        extractor.extract_from_bytes(fake_bytes)

    assert "magic header" in str(exc_info.value)


def test_empty_bytes():
    extractor = PDFExtractor()

    with pytest.raises(InvalidPDFFormatError) as exc_info:
        extractor.extract_from_bytes(b"")

    assert "empty" in str(exc_info.value)


def test_size_limit_exceeded():
    pdf_bytes = create_sample_pdf_bytes("Oversized payload test", pages=1)
    extractor = PDFExtractor(max_size_mb=0.0001)

    with pytest.raises(PDFSizeLimitExceededError):
        extractor.extract_from_bytes(pdf_bytes)


def test_page_limit_exceeded():
    pdf_bytes = create_sample_pdf_bytes("Multi page test", pages=5)
    extractor = PDFExtractor(max_pages=3)

    with pytest.raises(PDFPageLimitExceededError) as exc_info:
        extractor.extract_from_bytes(pdf_bytes)

    assert "exceeds safe threshold" in str(exc_info.value)


def test_text_cleaning_sanitization():
    extractor = PDFExtractor()
    raw_dirty = "Hello\x00 World!\r\n\r\n\r\nLine 2 with \x07 bell char."
    cleaned = extractor._clean_text(raw_dirty)

    assert "\x00" not in cleaned
    assert "\x07" not in cleaned
    assert "Hello World!" in cleaned
    assert "\r" not in cleaned
