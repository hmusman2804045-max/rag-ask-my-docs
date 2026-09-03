import tempfile
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.ingestion.pdf_extractor import PDFExtractor
from app.chunking.text_chunker import TextChunker
from app.embeddings.embedder import EmbeddingEngine
from app.storage.vector_store import VectorStore
from app.storage.memory_store import MemoryStore


def main():
    print("==================================================")
    print("  AskMyDocs -- Phase 4 Chroma DB & Memory Store  ")
    print("==================================================")

    sample_pdf_path = PROJECT_ROOT / "data" / "sample_project_spec.pdf"
    if not sample_pdf_path.exists():
        print(f"[!] Sample PDF missing at {sample_pdf_path}. Generating sample PDF...")
        from scripts.run_phase1_demo import create_demo_pdf
        create_demo_pdf(sample_pdf_path)

    print(f"\n[1] Ingesting document: {sample_pdf_path.name}")
    extractor = PDFExtractor()
    doc_payload = extractor.extract_from_path(sample_pdf_path)

    print("\n[2] Chunking text and generating 384-dim embeddings...")
    chunker = TextChunker(chunk_size=200, chunk_overlap=50)
    chunk_payload = chunker.chunk_document_payload(doc_payload)

    engine = EmbeddingEngine()
    embedded_payload = engine.embed_payload(chunk_payload)

    with tempfile.TemporaryDirectory() as tmp_chroma_dir:
        print(f"\n[3] Initializing persistent Chroma DB VectorStore at: {tmp_chroma_dir}")
        vector_store = VectorStore(persist_dir=tmp_chroma_dir, collection_name="demo_chunks")

        added_count = vector_store.add_embedded_payload(embedded_payload)
        stats = vector_store.get_stats()
        print(f"    Successfully stored {added_count} chunks into Chroma DB. (Total in DB: {stats['total_chunks']})")

        search_query = "What is the system architecture of AskMyDocs?"
        print(f"\n[4] Querying Chroma DB directly for: '{search_query}'")
        query_vector = engine.embed_text(search_query)

        results = vector_store.query_similar(query_vector, n_results=3)

        print("\n--- Chroma DB Top Relevant Results ---")
        for rank, res in enumerate(results, 1):
            meta = res["metadata"]
            print(f"\nRank #{rank} | Similarity Score: {res['similarity_score']} | ID: {res['chunk_id']} | Pages: {meta['page_numbers']}")
            print("+" + "-" * 60)
            for line in res["text"].split("\n"):
                print(f"|  {line}")
            print("+" + "-" * 60)

    print("\n[5] Initializing MongoDB MemoryStore for Conversation History...")
    memory_store = MemoryStore(mongo_uri="")

    session_id = "demo_session_789"
    user_id = "demo_user_001"

    print(f"    Saving User Message for session '{session_id}' (User: {user_id})...")
    memory_store.save_message(
        session_id=session_id,
        user_id=user_id,
        role="user",
        content="Can you summarize the architecture for me?"
    )

    print("    Saving Assistant Response...")
    memory_store.save_message(
        session_id=session_id,
        user_id=user_id,
        role="assistant",
        content="Flow A extracts text and embeds chunks into Chroma DB. Flow B answers user questions."
    )

    history = memory_store.get_chat_history(session_id, user_id, limit=5)

    print("\n--- Conversation History in MemoryStore ---")
    for msg in history:
        print(f"[{msg['timestamp'][:19]}] {msg['role'].upper()} ({msg['user_id']}): {msg['content']}")

    print("\n[+] Phase 4 Storage Integration Verification Complete!")


if __name__ == "__main__":
    main()
