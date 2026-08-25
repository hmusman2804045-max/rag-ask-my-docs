import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.ingestion.pdf_extractor import PDFExtractor
from app.chunking.text_chunker import TextChunker
from app.chunking.langchain_chunker import LangChainChunker, chunk_document_payload_langchain


def main():
    print("==================================================")
    print("   AskMyDocs -- Manual vs LangChain Chunker Demo   ")
    print("==================================================")

    sample_pdf_path = PROJECT_ROOT / "data" / "sample_project_spec.pdf"
    if not sample_pdf_path.exists():
        print(f"[!] Sample PDF missing at {sample_pdf_path}. Generating sample PDF...")
        from scripts.run_phase1_demo import create_demo_pdf
        create_demo_pdf(sample_pdf_path)

    print(f"\n[1] Extracting document text from: {sample_pdf_path.name}")
    extractor = PDFExtractor()
    doc_payload = extractor.extract_from_path(sample_pdf_path)
    print(f"    Document Total Chars: {doc_payload.total_chars} across {doc_payload.total_pages} pages.")

    chunk_size = 200
    chunk_overlap = 50

    print(f"\n[2] Executing both chunkers with chunk_size={chunk_size}, chunk_overlap={chunk_overlap}...")
    manual_chunker = TextChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    manual_payload = manual_chunker.chunk_document_payload(doc_payload)

    langchain_payload = chunk_document_payload_langchain(doc_payload, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    print("\n==================================================")
    print("         SIDE-BY-SIDE SUMMARY COMPARISON          ")
    print("==================================================")
    print(f"{'Metric':<25} | {'Manual TextChunker':<20} | {'LangChain Chunker':<20}")
    print("-" * 72)
    print(f"{'Total Chunks Generated':<25} | {manual_payload.total_chunks:<20} | {langchain_payload.total_chunks:<20}")
    print(f"{'Total Characters':<25} | {manual_payload.total_chars:<20} | {langchain_payload.total_chars:<20}")
    print(f"{'Average Chunk Size':<25} | {manual_payload.avg_chunk_size:<20} | {langchain_payload.avg_chunk_size:<20}")
    print("-" * 72)

    print("\n==================================================")
    print("          FIRST 2 CHUNKS COMPARISON               ")
    print("==================================================")

    max_compare_index = min(2, max(manual_payload.total_chunks, langchain_payload.total_chunks))

    for idx in range(max_compare_index):
        print(f"\n--- [ Chunk Index #{idx} ] ---")
        
        m_chunk = manual_payload.chunks[idx] if idx < manual_payload.total_chunks else None
        l_chunk = langchain_payload.chunks[idx] if idx < langchain_payload.total_chunks else None

        if m_chunk:
            print(f"\n[MANUAL TEXTCHUNKER - Chunk {idx}]")
            print(f"ID: {m_chunk.chunk_id} | Chars: {m_chunk.char_count} | Words: {m_chunk.word_count} | Pages: {m_chunk.page_numbers}")
            print("+" + "-" * 60)
            for line in m_chunk.text.split("\n"):
                print(f"| {line}")
            print("+" + "-" * 60)

        if l_chunk:
            print(f"\n[LANGCHAIN CHUNKER - Chunk {idx}]")
            print(f"ID: {l_chunk.chunk_id} | Chars: {l_chunk.char_count} | Words: {l_chunk.word_count} | Pages: {l_chunk.page_numbers}")
            print("+" + "-" * 60)
            for line in l_chunk.text.split("\n"):
                print(f"| {line}")
            print("+" + "-" * 60)

    print("\n==================================================")
    print("         HIGHLIGHTED STRUCTURAL DIFFERENCES       ")
    print("==================================================")

    diff_found = False
    for idx in range(min(len(manual_payload.chunks), len(langchain_payload.chunks))):
        m_c = manual_payload.chunks[idx]
        l_c = langchain_payload.chunks[idx]

        if m_c.text != l_c.text:
            diff_found = True
            print(f"\n[!] Split Difference detected at Chunk Index #{idx}:")
            print(f"    Manual Chunk Length:    {m_c.char_count} chars (Offset {m_c.start_char}-{m_c.end_char})")
            print(f"    LangChain Chunk Length: {l_c.char_count} chars (Offset {l_c.start_char}-{l_c.end_char})")
            print(f"    Manual Text Start:      '{m_c.text[:40]}...'")
            print(f"    LangChain Text Start:   '{l_c.text[:40]}...'")

    if not diff_found:
        print("[+] Both chunkers generated identical chunk boundaries on this document payload!")

    print("\n[+] Comparison script completed successfully.")


if __name__ == "__main__":
    main()
