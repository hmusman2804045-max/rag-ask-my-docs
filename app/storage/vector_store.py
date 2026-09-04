import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings

from app.embeddings.embedder import EmbeddedPayload, EmbeddedChunk


class VectorStore:
    DEFAULT_COLLECTION = "askmydocs_chunks"
    DEFAULT_DIR = "./data/chroma_db"

    def __init__(
        self,
        persist_dir: Optional[str] = None,
        collection_name: str = DEFAULT_COLLECTION
    ):
        self.persist_dir = persist_dir or os.getenv("CHROMA_DB_DIR", self.DEFAULT_DIR)
        Path(self.persist_dir).mkdir(parents=True, exist_ok=True)

        self.client = chromadb.PersistentClient(path=self.persist_dir)
        self.collection_name = collection_name
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def add_embedded_payload(self, payload: EmbeddedPayload) -> int:
        if not payload.chunks:
            return 0

        ids: List[str] = []
        embeddings: List[List[float]] = []
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []

        for chunk in payload.chunks:
            ids.append(chunk.chunk_id)
            embeddings.append(chunk.vector)
            documents.append(chunk.text)

            pages_str = ",".join(str(p) for p in chunk.page_numbers)
            metadatas.append({
                "chunk_id": chunk.chunk_id,
                "chunk_index": chunk.chunk_index,
                "doc_name": chunk.doc_name,
                "start_char": chunk.start_char,
                "end_char": chunk.end_char,
                "char_count": chunk.char_count,
                "word_count": chunk.word_count,
                "page_numbers": pages_str
            })

        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

        return len(ids)

    def query_similar(
        self,
        query_vector: List[float],
        n_results: int = 4,
        filter_doc: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if self.collection.count() == 0:
            return []

        where_clause = {"doc_name": filter_doc} if filter_doc else None

        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=min(n_results, self.collection.count()),
            where=where_clause
        )

        formatted_results: List[Dict[str, Any]] = []
        if not results or not results["ids"] or not results["ids"][0]:
            return formatted_results

        ids = results["ids"][0]
        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0] if results.get("distances") else [0.0] * len(ids)

        for chunk_id, doc_text, meta, dist in zip(ids, docs, metas, distances):
            similarity_score = max(0.0, min(1.0, 1.0 - float(dist)))

            page_nums_raw = meta.get("page_numbers", "1")
            page_numbers = [int(p) for p in page_nums_raw.split(",") if p.isdigit()]

            formatted_results.append({
                "chunk_id": chunk_id,
                "text": doc_text,
                "similarity_score": round(similarity_score, 4),
                "distance": round(float(dist), 4),
                "metadata": {
                    "doc_name": meta.get("doc_name", ""),
                    "chunk_index": meta.get("chunk_index", 0),
                    "start_char": meta.get("start_char", 0),
                    "end_char": meta.get("end_char", 0),
                    "char_count": meta.get("char_count", 0),
                    "word_count": meta.get("word_count", 0),
                    "page_numbers": page_numbers
                }
            })

        return formatted_results

    def list_documents(self) -> List[Dict[str, Any]]:
        """Aggregates indexed chunk metadata into a per-document summary listing."""
        if self.collection.count() == 0:
            return []

        records = self.collection.get(include=["metadatas"])
        metadatas = records.get("metadatas") or []

        summaries: Dict[str, Dict[str, Any]] = {}
        for meta in metadatas:
            if not meta:
                continue
            doc_name = meta.get("doc_name", "unknown_doc")
            entry = summaries.setdefault(doc_name, {
                "doc_name": doc_name,
                "chunk_count": 0,
                "char_count": 0,
                "word_count": 0,
                "page_count": 0
            })

            entry["chunk_count"] += 1
            entry["char_count"] += int(meta.get("char_count", 0) or 0)
            entry["word_count"] += int(meta.get("word_count", 0) or 0)

            pages_raw = str(meta.get("page_numbers", "") or "")
            page_numbers = [int(p) for p in pages_raw.split(",") if p.strip().isdigit()]
            if page_numbers:
                entry["page_count"] = max(entry["page_count"], max(page_numbers))

        return sorted(summaries.values(), key=lambda item: item["doc_name"])

    def delete_document(self, doc_name: str) -> int:
        existing = self.collection.get(where={"doc_name": doc_name})
        if existing and existing["ids"]:
            self.collection.delete(ids=existing["ids"])
            return len(existing["ids"])
        return 0

    def get_stats(self) -> Dict[str, Any]:
        return {
            "collection_name": self.collection_name,
            "total_chunks": self.collection.count(),
            "persist_dir": self.persist_dir
        }

    def reset_collection(self):
        self.client.delete_collection(self.collection_name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
