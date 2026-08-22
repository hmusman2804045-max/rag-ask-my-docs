import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.ingestion.pdf_extractor import PDFExtractor
from app.chunking.text_chunker import TextChunker


def main():
    print("==================================================")
    print("      AskMyDocs -- Phase 2 Text Chunking Demo      ")
    print("==================================================")

    sample_pdf_path = PROJECT_ROOT / "data" / "sample_project_spec.pdf"
    if not sample_pdf_path.exists():
        print(f"[!] Sample PDF missing at {sample_pdf_path}. Running Phase 1 demo first to generate it...")
        from scripts.run_phase1_demo import create_demo_pdf
        create_demo_pdf(sample_pdf_path)

    print(f"\n[1] Extracting text from: {sample_pdf_path.name}")
    extractor = PDFExtractor()
    doc_payload = extractor.extract_from_path(sample_pdf_path)
    print(f"    Extracted {doc_payload.total_chars} total characters across {doc_payload.total_pages} pages.")

    print("\n[2] Running TextChunker (chunk_size=200 chars, chunk_overlap=50 chars)...")
    chunker = TextChunker(chunk_size=200, chunk_overlap=50)
    chunk_payload = chunker.chunk_document_payload(doc_payload)

    print("\n--- Chunking Summary Statistics ---")
    print(f"Document Name:    {chunk_payload.doc_name}")
    print(f"Total Chunks:     {chunk_payload.total_chunks}")
    print(f"Total Chars:      {chunk_payload.total_chars}")
    print(f"Avg Chunk Size:   {chunk_payload.avg_chunk_size} chars")

    print("\n--- Visual Chunk Inspection ---")
    for chunk in chunk_payload.chunks:
        print(f"\n[+] {chunk.chunk_id} | Page(s): {chunk.page_numbers} | {chunk.word_count} words | {chunk.char_count} chars (Offset: {chunk.start_char}-{chunk.end_char})")
        print("+" + "-" * 60)
        for line in chunk.text.split("\n"):
            print(f"|  {line}")
        print("+" + "-" * 60)

    print("\n[+] Phase 2 Chunking Verification Complete: Overlapping chunks generated with metadata!")


if __name__ == "__main__":
    main()
