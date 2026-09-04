import logging
import os
from typing import List, Dict, Any, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logger = logging.getLogger(__name__)

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


class LLMEngine:
    DEFAULT_MODEL = "openai/gpt-oss-20b"

    def __init__(self, api_key: Optional[str] = None, model: str = DEFAULT_MODEL):
        self.api_key = api_key or os.getenv("GROQ_API_KEY", "")
        self.model = model
        self._client = None
        self.is_mock_mode = True

        if GROQ_AVAILABLE and self.api_key and self.api_key.startswith("gsk_"):
            try:
                self._client = Groq(api_key=self.api_key)
                self.is_mock_mode = False
            except Exception as err:
                logger.warning(f"Failed to initialize Groq client: {err}. Operating in mock mode.")
                self.is_mock_mode = True
        else:
            logger.warning("Groq API key missing or invalid format. LLMEngine operating in mock mode.")

    def extract_citations(self, retrieved_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        citations = []
        seen_chunks = set()

        for chunk in retrieved_chunks:
            chunk_id = chunk.get("chunk_id", "")
            if chunk_id in seen_chunks:
                continue
            seen_chunks.add(chunk_id)

            meta = chunk.get("metadata", {})
            citations.append({
                "chunk_id": chunk_id,
                "doc_name": meta.get("doc_name", "unknown_doc"),
                "page_numbers": meta.get("page_numbers", []),
                "similarity_score": chunk.get("similarity_score", 0.0)
            })

        return citations

    def generate_answer(
        self,
        messages: List[Dict[str, str]],
        retrieved_chunks: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        chunks = retrieved_chunks or []
        citations = self.extract_citations(chunks)

        if not self.is_mock_mode and self._client is not None:
            try:
                response = self._client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.2,
                    max_tokens=1024
                )
                answer = response.choices[0].message.content.strip()
                usage = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
                return {
                    "answer": answer,
                    "model": self.model,
                    "citations": citations,
                    "usage": usage,
                    "is_mock": False
                }
            except Exception as err:
                logger.error(f"Groq API call failed: {err}. Falling back to mock answer generation.")

        return self._generate_mock_answer(messages, chunks, citations)

    def _generate_mock_answer(
        self,
        messages: List[Dict[str, str]],
        chunks: List[Dict[str, Any]],
        citations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        user_msg = messages[-1]["content"] if messages else ""

        if not chunks or "No relevant document chunks" in user_msg:
            answer = "I don't know based on the provided context."
        else:
            top_chunk = chunks[0]
            text_snippet = top_chunk.get("text", "").strip()
            if len(text_snippet) > 250:
                text_snippet = text_snippet[:250] + "..."
            doc_name = top_chunk.get("metadata", {}).get("doc_name", "the document")
            pages = top_chunk.get("metadata", {}).get("page_numbers", [])
            answer = f"Based on {doc_name} (Page {pages}): {text_snippet}"

        return {
            "answer": answer,
            "model": f"{self.model}-mock",
            "citations": citations,
            "usage": {"prompt_tokens": 150, "completion_tokens": 50, "total_tokens": 200},
            "is_mock": True
        }
