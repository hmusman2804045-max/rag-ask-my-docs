from typing import List, Dict, Any, Optional


class PromptBuilder:
    DEFAULT_SYSTEM_PROMPT = (
        "You are AskMyDocs AI, a precise document assistant. "
        "Answer the user's question using ONLY the provided document context below. "
        "If the answer is not present in the provided context, state clearly: "
        "'I don't know based on the provided context.' "
        "Do not invent facts, speculate, or draw from outside knowledge."
    )

    def __init__(self, system_prompt: Optional[str] = None):
        self.system_prompt = system_prompt or self.DEFAULT_SYSTEM_PROMPT

    def build_context_block(self, retrieved_chunks: List[Dict[str, Any]]) -> str:
        if not retrieved_chunks:
            return "No relevant document chunks found."

        context_lines = []
        for idx, chunk in enumerate(retrieved_chunks, 1):
            meta = chunk.get("metadata", {})
            doc_name = meta.get("doc_name", "unknown_document")
            pages = meta.get("page_numbers", "N/A")
            score = chunk.get("similarity_score", 0.0)
            text = chunk.get("text", "").strip()

            header = f"--- CHUNK #{idx} | Document: {doc_name} | Pages: {pages} | Relevance: {score:.2f} ---"
            context_lines.append(header)
            context_lines.append(text)
            context_lines.append("")

        return "\n".join(context_lines).strip()

    def build_history_block(self, chat_history: List[Dict[str, Any]]) -> str:
        if not chat_history:
            return "No previous conversation history."

        history_lines = []
        for msg in chat_history:
            role = msg.get("role", "user").upper()
            content = msg.get("content", "").strip()
            history_lines.append(f"{role}: {content}")

        return "\n".join(history_lines).strip()

    def build_messages(
        self,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, str]]:
        context_str = self.build_context_block(retrieved_chunks)
        history_str = self.build_history_block(chat_history or [])

        user_content = (
            f"### RECENT CONVERSATION HISTORY\n"
            f"{history_str}\n\n"
            f"### RETRIEVED DOCUMENT CONTEXT\n"
            f"{context_str}\n\n"
            f"### USER QUESTION\n"
            f"{question.strip()}"
        )

        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_content}
        ]
