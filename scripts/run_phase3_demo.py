import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.ingestion.pdf_extractor import PDFExtractor
from app.chunking.text_chunker import TextChunker
from app.embeddings.embedder import EmbeddingEngine, cosine_similarity


def main():
    print("==================================================")
    print("     AskMyDocs -- Phase 3 Vector Embedding Demo    ")
    print("==================================================")

    sample_pdf_path = PROJECT_ROOT / "data" / "sample_project_spec.pdf"
    if not sample_pdf_path.exists():
        print(f"[!] Sample PDF missing at {sample_pdf_path}. Generating sample PDF...")
        from scripts.run_phase1_demo import create_demo_pdf
        create_demo_pdf(sample_pdf_path)

    print(f"\n[1] Ingesting document: {sample_pdf_path.name}")
    extractor = PDFExtractor()
    doc_payload = extractor.extract_from_path(sample_pdf_path)

    print("\n[2] Chunking document text...")
    chunker = TextChunker(chunk_size=200, chunk_overlap=50)
    chunk_payload = chunker.chunk_document_payload(doc_payload)
    print(f"    Generated {chunk_payload.total_chunks} chunks.")

    print("\n[3] Generating 384-dimensional vector embeddings (all-MiniLM-L6-v2)...")
    engine = EmbeddingEngine()
    embedded_payload = engine.embed_payload(chunk_payload)
    print(f"    Successfully generated {embedded_payload.total_chunks} vector embeddings (Dimension: {embedded_payload.vector_dim}).")

    search_query = "How does Flow A and Flow B pipeline work in the system?"
    print(f"\n[4] Executing Semantic Search for Query: '{search_query}'")

    query_vector = engine.embed_text(search_query)

    scored_chunks = []
    for chunk in embedded_payload.chunks:
        score = cosine_similarity(query_vector, chunk.vector)
        scored_chunks.append((score, chunk))

    scored_chunks.sort(key=lambda x: x[0], reverse=True)

    print("\n--- Semantic Search Results (Ranked by Cosine Similarity) ---")
    for rank, (score, chunk) in enumerate(scored_chunks, 1):
        print(f"\nRank #{rank} | Similarity Score: {score:.4f} | ID: {chunk.chunk_id} | Page(s): {chunk.page_numbers}")
        print("+" + "-" * 60)
        for line in chunk.text.split("\n"):
            print(f"|  {line}")
        print("+" + "-" * 60)

    print("\n[+] Phase 3 Vector Embedding Verification Complete!")


if __name__ == "__main__":
    main()
