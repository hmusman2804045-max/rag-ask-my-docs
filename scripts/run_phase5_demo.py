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
from app.generation.rag_pipeline import RAGPipeline


def main():
    print("==================================================")
    print("  AskMyDocs -- Phase 5 LLM Generation & Grounding ")
    print("==================================================")

    sample_pdf_path = PROJECT_ROOT / "data" / "sample_project_spec.pdf"
    if not sample_pdf_path.exists():
        print(f"[!] Sample PDF missing at {sample_pdf_path}. Generating sample PDF...")
        from scripts.run_phase1_demo import create_demo_pdf
        create_demo_pdf(sample_pdf_path)

    print(f"\n[1] Ingesting & Embedding document: {sample_pdf_path.name}")
    extractor = PDFExtractor()
    doc_payload = extractor.extract_from_path(sample_pdf_path)

    chunker = TextChunker(chunk_size=200, chunk_overlap=50)
    chunk_payload = chunker.chunk_document_payload(doc_payload)

    engine = EmbeddingEngine()
    embedded_payload = engine.embed_payload(chunk_payload)

    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp_chroma_dir:
        print(f"    Initializing Chroma DB VectorStore at: {tmp_chroma_dir}")
        vector_store = VectorStore(persist_dir=tmp_chroma_dir, collection_name="phase5_chunks")
        vector_store.add_embedded_payload(embedded_payload)

        memory_store = MemoryStore(mongo_uri="")
        pipeline = RAGPipeline(
            vector_store=vector_store,
            memory_store=memory_store,
            embedding_engine=engine
        )

        session_id = "phase5_demo_session"
        user_id = "phase5_user_001"

        q1 = "What is the system architecture of AskMyDocs?"
        print(f"\n[2] Question 1 (In-Context): '{q1}'")
        res1 = pipeline.ask(session_id, user_id, q1)
        print(f"    Answer: {res1['answer']}")
        print(f"    Citations: {res1['citations']}")

        q2 = "Can you elaborate on Flow B?"
        print(f"\n[3] Question 2 (Multi-Turn Follow-Up): '{q2}'")
        res2 = pipeline.ask(session_id, user_id, q2)
        print(f"    Answer: {res2['answer']}")
        print(f"    History Used: {res2['history_used_count']} previous messages")

        q3 = "What is the capital city of France?"
        print(f"\n[4] Question 3 (Out-Of-Context Grounding Test): '{q3}'")
        res3 = pipeline.ask(session_id, user_id, q3)
        print(f"    Answer: {res3['answer']}")

        print("\n--- Complete Session Chat History in MemoryStore ---")
        history = memory_store.get_chat_history(session_id, user_id)
        for msg in history:
            print(f"[{msg['role'].upper()}]: {msg['content']}")

    print("\n[+] Phase 5 RAG Pipeline Verification Complete!")


if __name__ == "__main__":
    main()
