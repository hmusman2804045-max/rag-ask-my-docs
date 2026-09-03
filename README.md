# AskMyDocs — High-Performance Document Q&A RAG System

![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)
![PyMuPDF](https://img.shields.io/badge/PyMuPDF-1.28%2B-green.svg)
![SentenceTransformers](https://img.shields.io/badge/SentenceTransformers-all--MiniLM--L6--v2-purple.svg)
![Chroma DB](https://img.shields.io/badge/Chroma_DB-Vector_Storage-orange.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Conversation_Memory-brightgreen.svg)
![PyTest](https://img.shields.io/badge/pytest-25_passed-success.svg)
![Architecture](https://img.shields.io/badge/RAG-Retrieval%20Augmented%20Generation-blue.svg)
![Status](https://img.shields.io/badge/Status-Phase_4_Complete-success.svg)

A production-grade **Retrieval-Augmented Generation (RAG)** system built to ingest private documents (PDFs, project specifications, technical reports), convert them into 384-dimensional vector embeddings, index them in **Chroma DB**, track per-user chat memory in **MongoDB**, and generate grounded, verifiable answers.

---

## 🌟 Key Features & Pipeline Architecture

```text
===================================================================================
                       AskMyDocs Architecture & Flow Pipeline
===================================================================================

 [Flow A — Ingestion & Storage]
 PDF Document -> PyMuPDF Extractor -> Recursive Chunking -> SentenceTransformers -> Chroma DB
                                    (Manual & LangChain)     (384-dim Vectors)    (VectorStore)

 [Flow B — Retrieval & Memory]
 User Question -> Vector Search (Chroma DB) + Chat History (MongoDB) -> Groq Llama 3.1 -> Answer
===================================================================================
```

### Completed Components

- **Phase 1: Secure Document Ingestion** (`app/ingestion/`):
  - Magic byte validation (`%PDF-`) ensuring genuine document payloads.
  - Resource safety limits: File size threshold guards (default 10MB) & max page count bounds (default 100 pages).
  - Domain exception hierarchy handling encrypted or corrupted documents cleanly.
  - Clean text extraction via PyMuPDF with control character & null byte stripping.

- **Phase 2: Dual Text Chunking Strategy** (`app/chunking/`):
  - **Manual Recursive Sliding Window**: Character sliding window splitter with word-boundary alignment and configurable target sizes (~200–300 words / 800 chars) and overlap (~150 chars).
  - **LangChain Engine Integration**: Production-grade alternative using `RecursiveCharacterTextSplitter`.
  - Side-by-side comparison inspector script (`scripts/compare_chunkers.py`).
  - Page-aware offset mapping linking text chunks to original PDF page numbers.

- **Phase 3: Dense Vector Embeddings** (`app/embeddings/`):
  - Local CPU embedding engine powered by `sentence-transformers` (`all-MiniLM-L6-v2`).
  - 384-dimensional floating-point vector generation for document chunks and queries.
  - Dot-product Cosine Similarity function for semantic distance scoring.

- **Phase 4: Vector Storage & Conversation Memory** (`app/storage/`):
  - **Chroma DB (`VectorStore`)**: Persistent local disk storage (`./data/chroma_db`) with HNSW cosine similarity space indexing, payload upserts, metadata filtering, and document deletion.
  - **MongoDB Atlas (`MemoryStore`)**: Per-user conversation history store tracking `session_id`, `user_id`, `role`, `content`, and ISO timestamps. Includes automatic in-memory fallback for offline test environments.

---

## 🌿 Git Branching Strategy (Git Flow)

This repository strictly enforces an enterprise **Git Flow** branching model:

| Branch Tier | Name Pattern | Purpose |
| :--- | :--- | :--- |
| **Production** | `main` | Production-ready, verified release code. |
| **Integration** | `develop` | Primary development branch where features are integrated and tested. |
| **Feature** | `feature/<phase-name>` | Isolated feature development (`feature/phase-1-document-ingestion`, `feature/phase-2-text-chunking`, `feature/phase-3-embeddings`, `feature/phase-4-chroma-mongodb`). |

---

## 📁 Repository Structure

```text
rag-ask-my-docs/
├── app/
│   ├── ingestion/
│   │   ├── exceptions.py       # Domain exception hierarchy
│   │   └── pdf_extractor.py    # PyMuPDF secure extraction engine
│   ├── chunking/
│   │   ├── text_chunker.py     # Recursive sliding window text chunker
│   │   └── langchain_chunker.py # LangChain RecursiveCharacterTextSplitter engine
│   ├── embeddings/
│   │   └── embedder.py         # SentenceTransformers 384-dim vector engine
│   └── storage/
│       ├── vector_store.py     # Chroma DB persistent vector store
│       └── memory_store.py     # MongoDB Atlas conversation history store
├── tests/
│   ├── test_pdf_extractor.py   # Ingestion unit test suite
│   ├── test_text_chunker.py    # Manual chunking unit test suite
│   ├── test_langchain_chunker.py # LangChain chunking unit test suite
│   ├── test_embedder.py      # Vector embedding unit test suite
│   ├── test_vector_store.py  # Chroma DB storage unit test suite
│   └── test_memory_store.py  # MongoDB memory store unit test suite
├── scripts/
│   ├── run_phase1_demo.py     # CLI document ingestion demo
│   ├── run_phase2_demo.py     # CLI visual chunking inspector
│   ├── compare_chunkers.py    # Side-by-side chunker visual inspector
│   ├── run_phase3_demo.py     # CLI semantic search vector embedding demo
│   └── run_phase4_demo.py     # CLI Chroma DB & MemoryStore integration demo
├── data/                       # Local document storage
├── requirements.txt            # Project dependencies
├── .env.example                # Environment configuration template
└── README.md
```

---

## 🚀 Quickstart & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/hmusman2804045-max/rag-ask-my-docs.git
cd rag-ask-my-docs
```

### 2. Set Up Virtual Environment
```bash
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 🧪 Verification & Demos

### Run Full PyTest Test Suite (25 Tests)
```bash
python -m pytest -v
```

### Run Ingestion Demo (Phase 1)
```bash
python scripts/run_phase1_demo.py
```

### Run Visual Chunk Inspector & Comparison (Phase 2)
```bash
python scripts/run_phase2_demo.py
python scripts/compare_chunkers.py
```

### Run Semantic Vector Embedding Demo (Phase 3)
```bash
python scripts/run_phase3_demo.py
```

### Run Storage & Memory Integration Demo (Phase 4)
```bash
python scripts/run_phase4_demo.py
```

---

## 🛣️ Project Roadmap

- [x] **Phase 1: Secure Document Ingestion** (PyMuPDF, Input Validation, Error Handling)
- [x] **Phase 2: Text Chunking Strategy** (Sliding Window Overlap, LangChain Engine Comparison)
- [x] **Phase 3: Vector Embeddings** (`all-MiniLM-L6-v2`, 384-dim Vectors, Cosine Similarity)
- [x] **Phase 4: Chroma Vector Database & MongoDB Memory** (Collection Storage, User Session History)
- [ ] **Phase 5: LLM Generation & Grounding** (Groq Llama 3.1 8B Instant, Prompt Engineering, Memory Recall)
- [ ] **Phase 6: Frontend & Cloud Deployment** (FastAPI, Modern UI, Render.com Docker Deployment)

---

## 👨‍💻 Author

**Hafiz Muhammad Usman**
- GitHub: [@hmusman2804045-max](https://github.com/hmusman2804045-max)
