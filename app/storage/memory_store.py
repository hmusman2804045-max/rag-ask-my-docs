from datetime import datetime, timezone
import logging
import os
from typing import List, Dict, Any, Optional
import pymongo
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)


class MemoryStore:
    DEFAULT_DB = "askmydocs"
    DEFAULT_COLLECTION = "conversations"
    MAX_CONTENT_LENGTH = 10000
    MAX_FALLBACK_SESSIONS = 50
    MAX_MESSAGES_PER_SESSION = 50

    def __init__(
        self,
        mongo_uri: Optional[str] = None,
        db_name: str = DEFAULT_DB,
        collection_name: str = DEFAULT_COLLECTION
    ):
        self.mongo_uri = mongo_uri or os.getenv("MONGODB_URI", "")
        self.db_name = db_name
        self.collection_name = collection_name
        self.is_connected = False

        self._client = None
        self._collection = None
        self._fallback_store: Dict[str, List[Dict[str, Any]]] = {}

        if self.mongo_uri and self.mongo_uri.startswith("mongodb"):
            try:
                self._client = pymongo.MongoClient(
                    self.mongo_uri,
                    serverSelectionTimeoutMS=2000
                )
                self._client.admin.command('ping')
                self._collection = self._client[self.db_name][self.collection_name]
                self._collection.create_index([
                    ("session_id", pymongo.ASCENDING),
                    ("user_id", pymongo.ASCENDING),
                    ("timestamp", pymongo.ASCENDING)
                ])
                self.is_connected = True
            except PyMongoError as err:
                self.is_connected = False
                logger.warning(f"MongoDB connection failed: {err}. Operating in in-memory fallback mode.")
        else:
            logger.info("No MongoDB URI provided. Operating in in-memory fallback mode.")

    def save_message(
        self,
        session_id: str,
        user_id: str,
        role: str,
        content: str
    ) -> Dict[str, Any]:
        clean_content = content.strip() if content else ""
        if len(clean_content) > self.MAX_CONTENT_LENGTH:
            logger.warning(f"Message content exceeds max limit ({len(clean_content)} > {self.MAX_CONTENT_LENGTH}). Truncating.")
            clean_content = clean_content[:self.MAX_CONTENT_LENGTH]

        record = {
            "session_id": session_id,
            "user_id": user_id,
            "role": role,
            "content": clean_content,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        if self.is_connected and self._collection is not None:
            try:
                self._collection.insert_one(record.copy())
            except PyMongoError as err:
                logger.error(f"Failed to save message to MongoDB: {err}. Writing to fallback store.")
                self._save_to_fallback(session_id, user_id, record)
        else:
            self._save_to_fallback(session_id, user_id, record)

        return record

    def get_chat_history(
        self,
        session_id: str,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        if self.is_connected and self._collection is not None:
            try:
                cursor = self._collection.find(
                    {"session_id": session_id, "user_id": user_id},
                    {"_id": 0}
                ).sort("timestamp", pymongo.ASCENDING)
                history = list(cursor)
                return history[-limit:] if limit > 0 else history
            except PyMongoError as err:
                logger.error(f"Failed to fetch history from MongoDB: {err}. Fetching from fallback store.")
                return self._get_from_fallback(session_id, user_id, limit)
        else:
            return self._get_from_fallback(session_id, user_id, limit)

    def clear_history(self, session_id: str, user_id: str) -> int:
        if self.is_connected and self._collection is not None:
            try:
                res = self._collection.delete_many({"session_id": session_id, "user_id": user_id})
                return res.deleted_count
            except PyMongoError as err:
                logger.error(f"Failed to clear history from MongoDB: {err}.")
                return 0

        key = f"{session_id}:{user_id}"
        if key in self._fallback_store:
            count = len(self._fallback_store[key])
            del self._fallback_store[key]
            return count
        return 0

    def _save_to_fallback(self, session_id: str, user_id: str, record: Dict[str, Any]):
        key = f"{session_id}:{user_id}"

        if key not in self._fallback_store:
            if len(self._fallback_store) >= self.MAX_FALLBACK_SESSIONS:
                oldest_key = next(iter(self._fallback_store))
                del self._fallback_store[oldest_key]
                logger.warning(f"Fallback session limit reached ({self.MAX_FALLBACK_SESSIONS}). Evicted oldest session: {oldest_key}")
            self._fallback_store[key] = []

        session_list = self._fallback_store[key]
        if len(session_list) >= self.MAX_MESSAGES_PER_SESSION:
            session_list.pop(0)
            logger.warning(f"Fallback message limit reached for session {key}. Evicted oldest message.")

        session_list.append(record)

    def _get_from_fallback(self, session_id: str, user_id: str, limit: int) -> List[Dict[str, Any]]:
        key = f"{session_id}:{user_id}"
        history = self._fallback_store.get(key, [])
        return history[-limit:] if limit > 0 else history
