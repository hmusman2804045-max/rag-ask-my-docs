# AskMyDocs (RAG) — Document Q&A System

[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![PyMuPDF Ingestion](https://img.shields.io/badge/Ingestion-PyMuPDF-green.svg)](https://pymupdf.readthedocs.io/)
[![Chunking Strategy](https://img.shields.io/badge/Chunking-Sliding%20Window%20%2B%20LangChain-orange.svg)](https://python.langchain.com/)
[![Dense Embeddings](https://img.shields.io/badge/Embeddings-all--MiniLM--L6--v2-blueviolet.svg)](https://www.sbert.net/)
[![Chroma DB Storage](https://img.shields.io/badge/Vector%20Store-ChromaDB-red.svg)](https://www.trychroma.com/)
[![MongoDB MemoryStore](https://img.shields.io/badge/MemoryStore-MongoDB-brightgreen.svg)](https://www.mongodb.com/)
[![Groq LLM Generation](https://img.shields.io/badge/LLM-Groq%20Llama%203.1%208B-yellow.svg)](https://groq.com/)
[![Git Flow](https://img.shields.io/badge/Branching-Git%20Flow-informational.svg)](https://github.com/hmusman2804045-max/rag-ask-my-docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An enterprise-grade, modular **Retrieval-Augmented Generation (RAG)** system designed to ingest, chunk, embed, index, retrieve, and answer complex user questions from private PDF documents with source citations and persistent multi-turn conversation memory.

---

## 🏗️ System Architecture & Pipeline

```text
                               [ AskMyDocs RAG Architecture ]

  Flow A: Document Ingestion & Storage Pipeline
  +--------------+     +-------------------+     +------------------+     +------------------------+     +-------------------+
  |  Upload PDF  | --> | PyMuPDF Extraction| --> | Sentence Chunking| --> | dense-vector Embeddings| --> | Chroma VectorStore|
  |  (Max 10MB)  |     | (%PDF- Magic Byte)|     | (Recursive Split)|     | (all-MiniLM-L6-v2 384d)|     | (Persistent HNSW) |
  +--------------+     +-------------------+     +------------------+     +------------------------+     +-------------------+

  Flow B: Conversational Retrieval & Generation Pipeline
  +--------------+     +--------------------+     +-------------------+     +------------------------+     +-------------------+
  | User Question| --> | Question Embedding | --> | Chroma Vector ANN | --> | Prompt Assembly &      | --> | Groq Llama 3.1 8B |
  | + Session ID |     | (all-MiniLM-L6-v2) |     | Top 3-5 Chunks    |     | System Grounding       |     | Answer Generation |
  +--------------+     +--------------------+     +-------------------+     +------------------------+     +-------------------+
                                                                                     ^                                 |
                                                                                     |                                 v
                                                                        +--------------------------+     +-------------------+
                                                                        | MongoDB MemoryStore      | <-- | Update History &  |
                                                                        | (Per-User Chat History)  |     | Source Citations  |
                                                                        +--------------------------+     +-------------------+
```

---

## ⚡ Key Features

- **Secure Ingestion (`Phase 1`)**: Multi-level validation (Magic Byte `%PDF-`, size bounds, page limits, encryption checks) powered by PyMuPDF.
- **Dual Chunking Engine (`Phase 2`)**: Manual sliding window chunker with word boundary alignment + LangChain `RecursiveCharacterTextSplitter`.
- **Dense Embeddings (`Phase 3`)**: 384-dimensional dense vector embeddings generated via `sentence-transformers` (`all-MiniLM-L6-v2`).
- **Persistent Vector & Memory Storage (`Phase 4`)**: Persistent Chroma DB ANN vector search with HNSW Cosine indexing + MongoDB Atlas conversation memory with in-memory fallback.
- **Grounded LLM Generation & Citations (`Phase 5`)**: Groq API integration (`llama-3.1-8b-instant`) with system grounding, citation extraction, multi-turn context memory, and offline mock execution mode.
- **REST API & 3D Web UI (`Phase 6`)**: FastAPI server with rate limiting and CORS, plus a React + Three.js client that renders the retrieval pipeline as an interactive 3D codex.

---

## 🧪 Test Suite Verification

Run the full automated test suite using `pytest`:

```bash
python -m pytest -v
```

Run individual phase CLI demo scripts:

```bash
# Phase 1 Ingestion Demo
python scripts/run_phase1_demo.py

# Phase 2 Chunking Comparison Demo
python scripts/compare_chunkers.py

# Phase 3 Embeddings & Semantic Search Demo
python scripts/run_phase3_demo.py

# Phase 4 Chroma DB & MemoryStore Demo
python scripts/run_phase4_demo.py

# Phase 5 End-to-End RAG Generation Demo
python scripts/run_phase5_demo.py
```

---

## 🌐 REST API & Web UI

Start the API server:

```bash
python scripts/run_api_server.py
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | MongoDB, Chroma and Groq readiness |
| `GET` | `/api/v1/documents` | List indexed documents with page/chunk/char totals |
| `POST` | `/api/v1/documents/upload` | Ingest a PDF (`multipart/form-data`, 5/min) |
| `DELETE` | `/api/v1/documents/{doc_name}` | Purge a document from the vector index |
| `POST` | `/api/v1/chat/ask` | Ask a question; returns the answer with citations (15/min) |
| `GET` | `/api/v1/chat/history/{session_id}` | Fetch stored conversation turns |
| `DELETE` | `/api/v1/chat/history/{session_id}` | Clear a session |

Interactive OpenAPI docs live at `http://127.0.0.1:8000/docs`.

Then start the **Neural Codex** frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The UI runs on `http://localhost:5173` and renders the pipeline as a 3D scene: a
laser sweeps the codex during ingestion, retrieved chunks detangle from its core
when a question is asked, and clicking a citation opens a source inspector showing
the exact chunk text from Chroma. See [`frontend/README.md`](frontend/README.md)
for details.

---

## 🛣️ Development Roadmap

- [x] **Phase 1**: Secure PDF Ingestion Engine
- [x] **Phase 2**: Dual Text Chunking Engine
- [x] **Phase 3**: Vector Embeddings Engine
- [x] **Phase 4**: Chroma DB & MongoDB MemoryStore Integration
- [x] **Phase 5**: LLM Generation & Grounding with Memory Context (Groq Llama 3.1 8B)
- [x] **Phase 6**: REST API Server (FastAPI) & 3D Web UI Frontend (React + Three.js)
