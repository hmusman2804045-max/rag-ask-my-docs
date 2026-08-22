# AskMyDocs (Document Q&A RAG System)

![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)
![PyMuPDF](https://img.shields.io/badge/PyMuPDF-1.28%2B-green.svg)
![PyTest](https://img.shields.io/badge/pytest-passing-brightgreen.svg)
![Architecture](https://img.shields.io/badge/RAG-Retrieval%20Augmented%20Generation-orange.svg)
![Status](https://img.shields.io/badge/Status-Phase%201%20%26%202%20Complete-success.svg)

A high-performance **Retrieval-Augmented Generation (RAG)** system built to ingest private documents (PDFs, project specifications, technical reports) and answer plain English questions using grounded context.

---

## 🌟 Key Features & Architecture

- **Secure Document Ingestion (Phase 1)**:
  - Magic byte validation (`%PDF-`) ensuring genuine document payloads.
  - Resource safety limits: File size threshold guards (default 10MB) & max page count bounds (default 100 pages) to prevent DoS memory spikes.
  - Automatic handling of encrypted or corrupted documents with domain exceptions.
  - Clean text extraction via PyMuPDF with control character & null byte stripping.

- **Recursive Overlapping Text Chunking (Phase 2)**:
  - Character sliding window splitter with configurable target sizes (~200–300 words / 800 chars) and overlap boundaries (~150 chars).
  - Recursive separator hierarchy (`["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " "]`) preserving sentence and paragraph integrity.
  - Page-aware offset mapping linking text chunks to original PDF page numbers.

---

## 🌿 Git Branching Strategy (Git Flow)

This repository strictly enforces an enterprise **Git Flow** branching model across three distinct branch tiers:

| Branch Tier | Name Pattern | Purpose |
| :--- | :--- | :--- |
| **Production** | `main` | Production-ready, verified release code. |
| **Integration** | `develop` | Primary development branch where feature branches are integrated and tested. |
| **Feature** | `feature/<phase-name>` | Isolated feature development (e.g. `feature/phase-1-document-ingestion`, `feature/phase-2-text-chunking`). |

---

## 📁 Repository Structure

```text
AskMyDocs/
├── app/
│   ├── ingestion/
│   │   ├── exceptions.py       # Domain exception hierarchy
│   │   └── pdf_extractor.py    # PyMuPDF secure extraction engine
│   └── chunking/
│       └── text_chunker.py     # Recursive sliding window text chunker
├── tests/
│   ├── test_pdf_extractor.py   # Ingestion unit test suite
│   └── test_text_chunker.py    # Chunking & overlap test suite
├── scripts/
│   ├── run_phase1_demo.py     # CLI document ingestion demo
│   └── run_phase2_demo.py     # CLI visual chunking inspector
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

### Run Full Test Suite
```bash
python -m pytest -v
```

### Run Ingestion Demo (Phase 1)
```bash
python scripts/run_phase1_demo.py
```

### Run Visual Chunk Inspector (Phase 2)
```bash
python scripts/run_phase2_demo.py
```

---

## 🛣️ Project Roadmap

- [x] **Phase 1: Secure Document Ingestion** (PyMuPDF, Input Validation, Error Handling)
- [x] **Phase 2: Text Chunking Strategy** (Sliding Window Overlap, Boundary Preservation)
- [ ] **Phase 3: Vector Embeddings** (`all-MiniLM-L6-v2`, Cosine Similarity Verification)
- [ ] **Phase 4: Chroma Vector Database** (Collection Storage, Similarity Queries)
- [ ] **Phase 5: LLM Generation & System Prompting** (Groq Llama 3.1 8B Instant)
- [ ] **Phase 6: Frontend & Cloud Deployment** (FastAPI, Modern UI, Render.com Docker Deployment)

---

## 👨‍💻 Author

**Hafiz Muhammad Usman**
- GitHub: [@hmusman2804045-max](https://github.com/hmusman2804045-max)
