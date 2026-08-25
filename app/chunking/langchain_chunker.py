from typing import List, Optional, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.ingestion.pdf_extractor import DocumentPayload, PageData
from app.chunking.text_chunker import ChunkData, ChunkingPayload


class LangChainChunker:
    def __init__(
        self,
        chunk_size: int = 800,
        chunk_overlap: int = 150
    ):
        if chunk_overlap >= chunk_size:
            raise ValueError(
                f"chunk_overlap ({chunk_overlap}) must be strictly smaller than chunk_size ({chunk_size})."
            )

        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            is_separator_regex=False
        )

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

        raw_chunks = self.splitter.split_text(text)
        page_char_ranges = self._build_page_ranges(pages) if pages else []
        chunks_data: List[ChunkData] = []
        clean_doc_slug = "".join(c if c.isalnum() else "_" for c in doc_name).strip("_")

        current_search_pos = 0

        for chunk_idx, chunk_text in enumerate(raw_chunks):
            chunk_str = chunk_text.strip()
            start_offset = text.find(chunk_str, max(0, current_search_pos - 100))
            if start_offset == -1:
                start_offset = current_search_pos

            end_offset = start_offset + len(chunk_str)
            current_search_pos = start_offset + max(1, len(chunk_str) - self.chunk_overlap)

            associated_pages = self._map_chars_to_pages(start_offset, end_offset, page_char_ranges)
            words = chunk_str.split()
            chunk_id = f"{clean_doc_slug}_langchain_chunk_{chunk_idx:03d}"

            chunk_obj = ChunkData(
                chunk_id=chunk_id,
                chunk_index=chunk_idx,
                text=chunk_str,
                char_count=len(chunk_str),
                word_count=len(words),
                start_char=start_offset,
                end_char=end_offset,
                doc_name=doc_name,
                page_numbers=associated_pages
            )
            chunks_data.append(chunk_obj)

        total_chars = sum(c.char_count for c in chunks_data)
        avg_size = (total_chars / len(chunks_data)) if chunks_data else 0.0

        return ChunkingPayload(
            doc_name=doc_name,
            total_chunks=len(chunks_data),
            total_chars=total_chars,
            avg_chunk_size=round(avg_size, 2),
            chunks=chunks_data
        )

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


def chunk_document_payload_langchain(
    payload: DocumentPayload,
    chunk_size: int = 800,
    chunk_overlap: int = 150
) -> ChunkingPayload:
    chunker = LangChainChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return chunker.chunk_document_payload(payload)
