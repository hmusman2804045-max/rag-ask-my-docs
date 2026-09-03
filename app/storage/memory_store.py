from datetime import datetime, timezone
import os
from typing import List, Dict, Any, Optional
import pymongo
from pymongo.errors import PyMongoError


class MemoryStore:
    DEFAULT_DB = "askmydocs"
    DEFAULT_COLLECTION = "conversations"

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
                self._collection.create_index([("session_id", pymongo.ASCENDING), ("timestamp", pymongo.ASCENDING)])
                self.is_connected = True
            except PyMongoError:
                self.is_connected = False

    def save_message(
        self,
        session_id: str,
        user_id: str,
        role: str,
        content: str
    ) -> Dict[str, Any]:
        record = {
            "session_id": session_id,
            "user_id": user_id,
            "role": role,
            "content": content.strip(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        if self.is_connected and self._collection is not None:
            try:
                self._collection.insert_one(record.copy())
            except PyMongoError:
                self._save_to_fallback(session_id, record)
        else:
            self._save_to_fallback(session_id, record)

        return record

    def get_chat_history(
        self,
        session_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        if self.is_connected and self._collection is not None:
            try:
                cursor = self._collection.find(
                    {"session_id": session_id},
                    {"_id": 0}
                ).sort("timestamp", pymongo.ASCENDING)
                history = list(cursor)
                return history[-limit:] if limit > 0 else history
            except PyMongoError:
                return self._get_from_fallback(session_id, limit)
        else:
            return self._get_from_fallback(session_id, limit)

    def clear_history(self, session_id: str) -> int:
        count = 0
        if self.is_connected and self._collection is not None:
            try:
                res = self._collection.delete_many({"session_id": session_id})
                count = res.deleted_count
            except PyMongoError:
                pass

        if session_id in self._fallback_store:
            count += len(self._fallback_store[session_id])
            del self._fallback_store[session_id]

        return count

    def _save_to_fallback(self, session_id: str, record: Dict[str, Any]):
        if session_id not in self._fallback_store:
            self._fallback_store[session_id] = []
        self._fallback_store[session_id].append(record)

    def _get_from_fallback(self, session_id: str, limit: int) -> List[Dict[str, Any]]:
        history = self._fallback_store.get(session_id, [])
        return history[-limit:] if limit > 0 else history
