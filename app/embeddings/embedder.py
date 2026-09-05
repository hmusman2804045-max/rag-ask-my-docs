from dataclasses import dataclass, field
from typing import List, Union
import numpy as np
from sentence_transformers import SentenceTransformer

from app.chunking.text_chunker import ChunkData, ChunkingPayload


@dataclass
class EmbeddedChunk:
    chunk_id: str
    chunk_index: int
    text: str
    char_count: int
    word_count: int
    start_char: int
    end_char: int
    doc_name: str
    page_numbers: List[int]
    vector: List[float]


@dataclass
class EmbeddedPayload:
    doc_name: str
    total_chunks: int
    vector_dim: int
    chunks: List[EmbeddedChunk]


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(np.dot(a, b) / (norm_a * norm_b))


class EmbeddingEngine:
    DEFAULT_MODEL = "all-MiniLM-L6-v2"

    def __init__(self, model_name: str = DEFAULT_MODEL):
        self.model_name = model_name
        self._model = None

    def _get_model(self) -> SentenceTransformer:
        if self._model is None:
            import torch
            torch.set_num_threads(1)
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def embed_text(self, text: str) -> List[float]:
        text = text.strip() if text else ""
        if not text:
            return [0.0] * 384

        model = self._get_model()
        vector = model.encode(text, convert_to_numpy=True)
        return vector.tolist()

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        cleaned_texts = [t.strip() for t in texts]
        model = self._get_model()
        vectors = model.encode(cleaned_texts, convert_to_numpy=True)
        return vectors.tolist()

    def embed_chunks(self, chunks: List[ChunkData]) -> List[EmbeddedChunk]:
        if not chunks:
            return []

        texts = [c.text for c in chunks]
        vectors = self.embed_texts(texts)

        embedded_chunks: List[EmbeddedChunk] = []
        for chunk, vector in zip(chunks, vectors):
            embedded_chunks.append(
                EmbeddedChunk(
                    chunk_id=chunk.chunk_id,
                    chunk_index=chunk.chunk_index,
                    text=chunk.text,
                    char_count=chunk.char_count,
                    word_count=chunk.word_count,
                    start_char=chunk.start_char,
                    end_char=chunk.end_char,
                    doc_name=chunk.doc_name,
                    page_numbers=chunk.page_numbers,
                    vector=vector
                )
            )

        return embedded_chunks

    def embed_payload(self, payload: ChunkingPayload) -> EmbeddedPayload:
        if not payload.chunks:
            return EmbeddedPayload(
                doc_name=payload.doc_name,
                total_chunks=0,
                vector_dim=384,
                chunks=[]
            )

        embedded_chunks = self.embed_chunks(payload.chunks)
        vector_dim = len(embedded_chunks[0].vector) if embedded_chunks else 384

        return EmbeddedPayload(
            doc_name=payload.doc_name,
            total_chunks=len(embedded_chunks),
            vector_dim=vector_dim,
            chunks=embedded_chunks
        )
