from dataclasses import dataclass
from pathlib import Path
import re
from typing import List, Dict, Union, Optional
import pymupdf as fitz

from app.ingestion.exceptions import (
    PDFIngestionError,
    InvalidPDFFormatError,
    PDFSizeLimitExceededError,
    PDFPageLimitExceededError,
    PDFEncryptedError
)


PDF_MAGIC_BYTES = b"%PDF-"


@dataclass
class PageData:
    page_num: int
    text: str
    char_count: int


@dataclass
class DocumentPayload:
    filename: str
    total_pages: int
    total_chars: int
    full_text: str
    pages: List[PageData]


class PDFExtractor:
    def __init__(
        self,
        max_size_mb: float = 10.0,
        max_pages: int = 100
    ):
        self.max_size_bytes = int(max_size_mb * 1024 * 1024)
        self.max_pages = max_pages

    def extract_from_path(self, file_path: Union[str, Path]) -> DocumentPayload:
        path = Path(file_path)
        if not path.is_file():
            raise PDFIngestionError(f"File not found at path: {path}")

        file_size = path.stat().st_size
        if file_size > self.max_size_bytes:
            raise PDFSizeLimitExceededError(
                f"File size ({file_size / (1024*1024):.2f}MB) exceeds limit of "
                f"{self.max_size_bytes / (1024*1024):.2f}MB."
            )

        with open(path, "rb") as f:
            content = f.read()

        return self.extract_from_bytes(content, filename=path.name)

    def extract_from_bytes(
        self,
        pdf_bytes: bytes,
        filename: str = "uploaded_document.pdf"
    ) -> DocumentPayload:
        if not pdf_bytes:
            raise InvalidPDFFormatError("PDF payload is empty (0 bytes).")

        if len(pdf_bytes) > self.max_size_bytes:
            raise PDFSizeLimitExceededError(
                f"Payload size ({len(pdf_bytes) / (1024*1024):.2f}MB) exceeds safety threshold."
            )

        if not pdf_bytes.startswith(PDF_MAGIC_BYTES):
            if PDF_MAGIC_BYTES not in pdf_bytes[:1024]:
                raise InvalidPDFFormatError("File lacks valid PDF magic header (%PDF-).")

        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as err:
            raise InvalidPDFFormatError(f"PyMuPDF failed to parse document structure: {err}")

        with doc:
            if doc.is_encrypted:
                raise PDFEncryptedError(
                    f"Document '{filename}' is password protected or encrypted."
                )

            total_pages = len(doc)
            if total_pages == 0:
                raise InvalidPDFFormatError(f"Document '{filename}' contains 0 pages.")

            if total_pages > self.max_pages:
                raise PDFPageLimitExceededError(
                    f"Document page count ({total_pages}) exceeds safe threshold of {self.max_pages} pages."
                )

            pages_data: List[PageData] = []
            full_text_chunks: List[str] = []

            for page_index in range(total_pages):
                page_num = page_index + 1
                try:
                    page = doc.load_page(page_index)
                    raw_text = page.get_text("text")
                    cleaned_text = self._clean_text(raw_text)

                    pages_data.append(
                        PageData(
                            page_num=page_num,
                            text=cleaned_text,
                            char_count=len(cleaned_text)
                        )
                    )
                    if cleaned_text:
                        full_text_chunks.append(cleaned_text)

                except Exception:
                    pages_data.append(
                        PageData(
                            page_num=page_num,
                            text="",
                            char_count=0
                        )
                    )

            aggregated_text = "\n\n".join(full_text_chunks)

            return DocumentPayload(
                filename=filename,
                total_pages=total_pages,
                total_chars=len(aggregated_text),
                full_text=aggregated_text,
                pages=pages_data
            )

    def _clean_text(self, text: str) -> str:
        if not text:
            return ""

        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        text = re.sub(r'\n{3,}', '\n\n', text)
        lines = [line.rstrip() for line in text.split('\n')]
        normalized_text = '\n'.join(lines)

        return normalized_text.strip()
