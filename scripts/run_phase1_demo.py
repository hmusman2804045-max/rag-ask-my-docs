import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import pymupdf as fitz
from app.ingestion.pdf_extractor import PDFExtractor


def create_demo_pdf(output_path: Path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = fitz.open()

    p1 = doc.new_page()
    p1.insert_text(
        (50, 50),
        "AskMyDocs RAG System -- Technical Specification\n\n"
        "1. Overview\n"
        "AskMyDocs is a high-performance Retrieval-Augmented Generation system.\n"
        "It ingests private PDF documents, breaks them into vector embeddings,\n"
        "and retrieves contextually accurate answers using Groq Llama 3.1.\n",
        fontsize=12
    )

    p2 = doc.new_page()
    p2.insert_text(
        (50, 50),
        "2. Architecture & Pipeline\n"
        "Flow A: PDF Upload -> PyMuPDF Text Extraction -> Chunking -> Chroma DB.\n"
        "Flow B: User Question -> Sentence Transformer -> Vector Search -> Llama 3.1.\n",
        fontsize=12
    )

    doc.save(output_path)
    doc.close()
    print(f"[+] Demo PDF created successfully at: {output_path}")


def main():
    print("==================================================")
    print("   AskMyDocs -- Phase 1 Document Ingestion Demo   ")
    print("==================================================")

    data_dir = PROJECT_ROOT / "data"
    sample_pdf_path = data_dir / "sample_project_spec.pdf"

    if not sample_pdf_path.exists():
        create_demo_pdf(sample_pdf_path)

    extractor = PDFExtractor(max_size_mb=10.0, max_pages=50)

    print(f"\n[>] Ingesting PDF file: {sample_pdf_path.name}")
    payload = extractor.extract_from_path(sample_pdf_path)

    print("\n--- Document Extraction Summary ---")
    print(f"Filename:     {payload.filename}")
    print(f"Total Pages:  {payload.total_pages}")
    print(f"Total Chars:  {payload.total_chars}")

    print("\n--- Page Breakdown ---")
    for page in payload.pages:
        print(f"  Page {page.page_num}: {page.char_count} chars extracted")

    print("\n--- Extracted Text Content Preview ---")
    print(payload.full_text)
    print("--------------------------------------")
    print("\n[+] Phase 1 Ingestion Verification Complete: Clean Text Extracted Successfully!")


if __name__ == "__main__":
    main()
