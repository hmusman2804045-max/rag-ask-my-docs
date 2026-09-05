from datetime import datetime, timezone
import logging
import math
import os
from typing import List, Dict, Any, Optional
import pymongo
from pymongo.errors import PyMongoError

from app.embeddings.embedder import EmbeddedPayload, EmbeddedChunk

logger = logging.getLogger(__name__)


def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calculates cosine similarity between two float vectors."""
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm_a * norm_b)))


class VectorStore:
    DEFAULT_DB = "askmydocs"
    DEFAULT_COLLECTION = "document_chunks"
    DEFAULT_INDEX_NAME = "vector_index"
    VECTOR_DIMENSIONS = 384

    def __init__(
        self,
        mongo_uri: Optional[str] = None,
        db_name: str = DEFAULT_DB,
        collection_name: str = DEFAULT_COLLECTION,
        index_name: str = DEFAULT_INDEX_NAME,
        persist_dir: Optional[str] = None
    ):
        self.mongo_uri = mongo_uri or os.getenv("MONGODB_URI", "")
        self.db_name = db_name
        self.collection_name = collection_name
        self.index_name = index_name
        self.persist_dir = persist_dir or os.getenv("CHROMA_PERSIST_DIR", "./data/vector_store")

        self.is_connected = False
        self._client: Optional[pymongo.MongoClient] = None
        self._collection: Optional[pymongo.collection.Collection] = None

        # Resilient in-memory fallback store when MongoDB is offline / unconfigured
        self._fallback_chunks: Dict[str, Dict[str, Any]] = {}

        if self.mongo_uri and self.mongo_uri.startswith("mongodb"):
            try:
                self._client = pymongo.MongoClient(
                    self.mongo_uri,
                    serverSelectionTimeoutMS=2500
                )
                self._client.admin.command("ping")
                self._collection = self._client[self.db_name][self.collection_name]
                self._collection.create_index([("doc_name", pymongo.ASCENDING)])
                self._collection.create_index([("chunk_id", pymongo.ASCENDING)], unique=True)
                self.is_connected = True
                logger.info(f"MongoDB VectorStore connected to [{self.db_name}.{self.collection_name}].")
            except PyMongoError as err:
                self.is_connected = False
                logger.warning(
                    f"MongoDB VectorStore connection failed: {err}. "
                    "Operating in in-memory fallback vector search mode."
                )
        else:
            logger.info("No MongoDB URI provided for VectorStore. Operating in in-memory fallback mode.")

    def add_embedded_payload(self, payload: EmbeddedPayload) -> int:
        """Stores embedded chunks with their 384-dim vector representations and metadata."""
        if not payload.chunks:
            return 0

        records: List[Dict[str, Any]] = []
        for chunk in payload.chunks:
            records.append({
                "chunk_id": chunk.chunk_id,
                "chunk_index": chunk.chunk_index,
                "doc_name": chunk.doc_name,
                "text": chunk.text,
                "vector": chunk.vector,
                "start_char": chunk.start_char,
                "end_char": chunk.end_char,
                "char_count": chunk.char_count,
                "word_count": chunk.word_count,
                "page_numbers": list(chunk.page_numbers),
                "created_at": datetime.now(timezone.utc).isoformat()
            })

        if self.is_connected and self._collection is not None:
            try:
                # Upsert records in a single bulk operation
                operations = [
                    pymongo.ReplaceOne({"chunk_id": rec["chunk_id"]}, rec, upsert=True)
                    for rec in records
                ]
                self._collection.bulk_write(operations, ordered=False)
                logger.info(f"Upserted {len(records)} chunks into MongoDB VectorStore.")
                return len(records)
            except PyMongoError as err:
                logger.error(f"Failed to upsert chunks into MongoDB VectorStore: {err}")
                for rec in records:
                    self._fallback_chunks[rec["chunk_id"]] = rec
                return len(records)
        else:
            for rec in records:
                self._fallback_chunks[rec["chunk_id"]] = rec
            return len(records)

    def query_similar(
        self,
        query_vector: List[float],
        n_results: int = 4,
        filter_doc: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Queries for top-N most similar chunks using MongoDB Atlas Vector Search or in-memory fallback."""
        if self.is_connected and self._collection is not None:
            try:
                # Attempt MongoDB Atlas $vectorSearch aggregation pipeline
                search_stage: Dict[str, Any] = {
                    "$vectorSearch": {
                        "index": self.index_name,
                        "path": "vector",
                        "queryVector": query_vector,
                        "numCandidates": max(n_results * 10, 40),
                        "limit": n_results
                    }
                }
                if filter_doc:
                    search_stage["$vectorSearch"]["filter"] = {"doc_name": {"$eq": filter_doc}}

                pipeline = [
                    search_stage,
                    {
                        "$project": {
                            "_id": 0,
                            "chunk_id": 1,
                            "text": 1,
                            "doc_name": 1,
                            "chunk_index": 1,
                            "start_char": 1,
                            "end_char": 1,
                            "char_count": 1,
                            "word_count": 1,
                            "page_numbers": 1,
                            "similarity_score": {"$meta": "vectorSearchScore"}
                        }
                    }
                ]

                cursor = self._collection.aggregate(pipeline)
                results = list(cursor)

                if results:
                    return [
                        {
                            "chunk_id": doc["chunk_id"],
                            "text": doc["text"],
                            "similarity_score": round(max(0.0, min(1.0, float(doc.get("similarity_score", 0.0)))), 4),
                            "metadata": {
                                "doc_name": doc.get("doc_name", ""),
                                "chunk_index": doc.get("chunk_index", 0),
                                "start_char": doc.get("start_char", 0),
                                "end_char": doc.get("end_char", 0),
                                "char_count": doc.get("char_count", 0),
                                "word_count": doc.get("word_count", 0),
                                "page_numbers": doc.get("page_numbers", [1])
                            }
                        }
                        for doc in results
                    ]
            except PyMongoError as err:
                # If Atlas search index is not yet built or offline, fall back to exact cosine search over MongoDB docs
                logger.warning(
                    f"Atlas $vectorSearch query failed ({err}). "
                    "Falling back to exact in-memory cosine search over documents."
                )

        # In-memory cosine similarity fallback (works for offline or non-Atlas MongoDB instances)
        docs_to_search: List[Dict[str, Any]] = []
        if self.is_connected and self._collection is not None:
            try:
                query_filter = {"doc_name": filter_doc} if filter_doc else {}
                cursor = self._collection.find(query_filter, {"_id": 0})
                docs_to_search = list(cursor)
            except PyMongoError:
                docs_to_search = list(self._fallback_chunks.values())
        else:
            docs_to_search = [
                chunk for chunk in self._fallback_chunks.values()
                if not filter_doc or chunk.get("doc_name") == filter_doc
            ]

        if not docs_to_search:
            return []

        scored_docs: List[Dict[str, Any]] = []
        for item in docs_to_search:
            vec = item.get("vector")
            if not vec:
                continue
            sim = _cosine_similarity(query_vector, vec)
            scored_docs.append({
                "chunk_id": item["chunk_id"],
                "text": item.get("text", ""),
                "similarity_score": round(sim, 4),
                "metadata": {
                    "doc_name": item.get("doc_name", ""),
                    "chunk_index": item.get("chunk_index", 0),
                    "start_char": item.get("start_char", 0),
                    "end_char": item.get("end_char", 0),
                    "char_count": item.get("char_count", 0),
                    "word_count": item.get("word_count", 0),
                    "page_numbers": item.get("page_numbers", [1])
                }
            })

        scored_docs.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_docs[:n_results]

    def list_documents(self) -> List[Dict[str, Any]]:
        """Aggregates indexed chunk metadata into a per-document summary listing."""
        docs: List[Dict[str, Any]] = []
        if self.is_connected and self._collection is not None:
            try:
                cursor = self._collection.find({}, {"_id": 0, "vector": 0})
                docs = list(cursor)
            except PyMongoError as err:
                logger.error(f"Failed to list documents from MongoDB: {err}.")
                docs = list(self._fallback_chunks.values())
        else:
            docs = list(self._fallback_chunks.values())

        if not docs:
            return []

        summaries: Dict[str, Dict[str, Any]] = {}
        for doc in docs:
            doc_name = doc.get("doc_name", "unknown_doc")
            entry = summaries.setdefault(doc_name, {
                "doc_name": doc_name,
                "chunk_count": 0,
                "char_count": 0,
                "word_count": 0,
                "page_count": 0
            })

            entry["chunk_count"] += 1
            entry["char_count"] += int(doc.get("char_count", 0) or 0)
            entry["word_count"] += int(doc.get("word_count", 0) or 0)

            pages = doc.get("page_numbers") or []
            if isinstance(pages, list) and pages:
                entry["page_count"] = max(entry["page_count"], max(pages))

        return sorted(summaries.values(), key=lambda item: item["doc_name"])

    def delete_document(self, doc_name: str) -> int:
        """Deletes all chunks belonging to a document from the vector store."""
        if self.is_connected and self._collection is not None:
            try:
                res = self._collection.delete_many({"doc_name": doc_name})
                return res.deleted_count
            except PyMongoError as err:
                logger.error(f"Failed to delete document from MongoDB: {err}.")
                return 0

        to_del = [cid for cid, chunk in self._fallback_chunks.items() if chunk.get("doc_name") == doc_name]
        for cid in to_del:
            del self._fallback_chunks[cid]
        return len(to_del)

    def get_stats(self) -> Dict[str, Any]:
        """Returns storage statistics and connection status."""
        total_chunks = 0
        if self.is_connected and self._collection is not None:
            try:
                total_chunks = self._collection.count_documents({})
            except PyMongoError:
                total_chunks = len(self._fallback_chunks)
        else:
            total_chunks = len(self._fallback_chunks)

        return {
            "collection_name": self.collection_name,
            "total_chunks": total_chunks,
            "backend": "mongodb_atlas" if self.is_connected else "in_memory_fallback",
            "mongodb_connected": self.is_connected
        }

    def get_health(self) -> Dict[str, Any]:
        """Returns health status for API diagnostics."""
        return {
            "vector_store_connected": self.is_connected,
            "using_fallback": not self.is_connected,
            "total_chunks": len(self._fallback_chunks) if not self.is_connected else (
                self._collection.count_documents({}) if self._collection is not None else 0
            )
        }

    def reset_collection(self):
        """Clears all indexed chunks from the collection."""
        if self.is_connected and self._collection is not None:
            try:
                self._collection.delete_many({})
            except PyMongoError as err:
                logger.error(f"Failed to reset collection in MongoDB: {err}.")
        self._fallback_chunks.clear()
