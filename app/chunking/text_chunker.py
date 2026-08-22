from dataclasses import dataclass, field
import re
from typing import List, Dict, Any, Optional

from app.ingestion.pdf_extractor import DocumentPayload, PageData


@dataclass
class ChunkData:
    chunk_id: str
    chunk_index: int
    text: str
    char_count: int
    word_count: int
    start_char: int
    end_char: int
    doc_name: str
    page_numbers: List[int] = field(default_factory=list)


@dataclass
class ChunkingPayload:
    doc_name: str
    total_chunks: int
    total_chars: int
    avg_chunk_size: float
    chunks: List[ChunkData]


class TextChunker:
    def __init__(
        self,
        chunk_size: int = 800,
        chunk_overlap: int = 150,
        min_chunk_size: int = 50,
        separators: Optional[List[str]] = None
    ):
        if chunk_overlap >= chunk_size:
            raise ValueError(
                f"chunk_overlap ({chunk_overlap}) must be strictly smaller than chunk_size ({chunk_size})."
            )

        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        self.separators = separators or ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " "]

    def chunk_document_payload(self, payload: DocumentPayload) -> ChunkingPayload:
        return self.chunk_text(
            text=payload.full_text,
            doc_name=payload.filename,
            pages=payload.pages
        )

    def chunk_text(
        self,
        text: str,
        doc_name: str = "document.pdf",
        pages: Optional[List[PageData]] = None
    ) -> ChunkingPayload:
        text = text.strip() if text else ""
        if not text:
            return ChunkingPayload(
                doc_name=doc_name,
                total_chunks=0,
                total_chars=0,
                avg_chunk_size=0.0,
                chunks=[]
            )

        page_char_ranges = self._build_page_ranges(pages) if pages else []
        chunks_data: List[ChunkData] = []
        clean_doc_slug = "".join(c if c.isalnum() else "_" for c in doc_name).strip("_")

        start_idx = 0
        text_len = len(text)
        chunk_idx = 0

        while start_idx < text_len:
            target_end_idx = min(text_len, start_idx + self.chunk_size)

            if target_end_idx < text_len:
                actual_end_idx = self._find_best_split_point(text, start_idx, target_end_idx)
            else:
                actual_end_idx = text_len

            chunk_text_slice = text[start_idx:actual_end_idx].strip()

            if len(chunk_text_slice) >= self.min_chunk_size or not chunks_data:
                actual_start = start_idx
                actual_end = actual_start + len(chunk_text_slice)

                associated_pages = self._map_chars_to_pages(actual_start, actual_end, page_char_ranges)
                words = chunk_text_slice.split()
                chunk_id = f"{clean_doc_slug}_chunk_{chunk_idx:03d}"

                chunk_obj = ChunkData(
                    chunk_id=chunk_id,
                    chunk_index=chunk_idx,
                    text=chunk_text_slice,
                    char_count=len(chunk_text_slice),
                    word_count=len(words),
                    start_char=actual_start,
                    end_char=actual_end,
                    doc_name=doc_name,
                    page_numbers=associated_pages
                )
                chunks_data.append(chunk_obj)
                chunk_idx += 1

            if actual_end_idx >= text_len:
                break

            next_start_candidate = max(start_idx + 1, actual_end_idx - self.chunk_overlap)
            next_start_idx = self._align_to_word_start(text, next_start_candidate, actual_end_idx)

            if next_start_idx <= start_idx:
                next_start_idx = start_idx + max(1, self.chunk_size - self.chunk_overlap)

            start_idx = next_start_idx

        total_chars = sum(c.char_count for c in chunks_data)
        avg_size = (total_chars / len(chunks_data)) if chunks_data else 0.0

        return ChunkingPayload(
            doc_name=doc_name,
            total_chunks=len(chunks_data),
            total_chars=total_chars,
            avg_chunk_size=round(avg_size, 2),
            chunks=chunks_data
        )

    def _find_best_split_point(self, text: str, start_idx: int, target_end_idx: int) -> int:
        min_allowed = start_idx + max(self.min_chunk_size, (target_end_idx - start_idx) // 2)

        for sep in self.separators:
            pos = text.rfind(sep, min_allowed, target_end_idx)
            if pos != -1:
                return pos + len(sep)

        return target_end_idx

    def _align_to_word_start(self, text: str, start_candidate: int, max_limit: int) -> int:
        pos = start_candidate
        while pos < max_limit and not text[pos].isspace():
            pos += 1

        while pos < max_limit and text[pos].isspace():
            pos += 1

        return pos if pos < max_limit else start_candidate

    def _build_page_ranges(self, pages: List[PageData]) -> List[Dict[str, Any]]:
        ranges = []
        cumulative_pos = 0
        for page in pages:
            text_len = len(page.text)
            ranges.append({
                "page_num": page.page_num,
                "start": cumulative_pos,
                "end": cumulative_pos + text_len
            })
            cumulative_pos += text_len + 2
        return ranges

    def _map_chars_to_pages(
        self,
        start_char: int,
        end_char: int,
        page_ranges: List[Dict[str, Any]]
    ) -> List[int]:
        if not page_ranges:
            return [1]

        matching_pages = []
        for p in page_ranges:
            if not (end_char < p["start"] or start_char > p["end"]):
                matching_pages.append(p["page_num"])

        return matching_pages if matching_pages else [1]
