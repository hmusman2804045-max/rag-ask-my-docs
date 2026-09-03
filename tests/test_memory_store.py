import pytest
from app.storage.memory_store import MemoryStore


@pytest.fixture
def memory_store():
    return MemoryStore(mongo_uri="")


def test_memory_store_fallback_save_and_retrieve(memory_store):
    session_id = "test_session_101"
    user_id = "user_abc"

    msg1 = memory_store.save_message(
        session_id=session_id,
        user_id=user_id,
        role="user",
        content="What dataset did the project use?"
    )

    msg2 = memory_store.save_message(
        session_id=session_id,
        user_id=user_id,
        role="assistant",
        content="The project used the NIH Chest X-ray dataset."
    )

    assert msg1["role"] == "user"
    assert msg2["role"] == "assistant"
    assert "timestamp" in msg1

    history = memory_store.get_chat_history(session_id, user_id, limit=10)
    assert len(history) == 2
    assert history[0]["content"] == "What dataset did the project use?"
    assert history[1]["content"] == "The project used the NIH Chest X-ray dataset."


def test_user_session_privacy_isolation(memory_store):
    session_id = "shared_session_999"
    user_a = "user_alice"
    user_b = "user_bob"

    memory_store.save_message(session_id, user_a, "user", "Alice secret question")
    memory_store.save_message(session_id, user_b, "user", "Bob separate question")

    history_alice = memory_store.get_chat_history(session_id, user_a)
    history_bob = memory_store.get_chat_history(session_id, user_b)

    assert len(history_alice) == 1
    assert history_alice[0]["content"] == "Alice secret question"
    assert history_alice[0]["user_id"] == user_a

    assert len(history_bob) == 1
    assert history_bob[0]["content"] == "Bob separate question"
    assert history_bob[0]["user_id"] == user_b


def test_content_length_truncation(memory_store):
    session_id = "test_session_long"
    user_id = "user_long"
    long_content = "A" * 15000

    msg = memory_store.save_message(session_id, user_id, "user", long_content)

    assert len(msg["content"]) == MemoryStore.MAX_CONTENT_LENGTH
    assert msg["content"].endswith("A")


def test_fallback_capacity_limits(memory_store):
    session_id = "cap_session"
    user_id = "cap_user"

    for i in range(MemoryStore.MAX_MESSAGES_PER_SESSION + 10):
        memory_store.save_message(session_id, user_id, "user", f"Msg {i}")

    history = memory_store.get_chat_history(session_id, user_id, limit=100)
    assert len(history) == MemoryStore.MAX_MESSAGES_PER_SESSION
    assert history[0]["content"] == "Msg 10"


def test_memory_store_clear_history(memory_store):
    session_id = "test_session_103"
    user_id = "user_clear"

    memory_store.save_message(session_id, user_id, "user", "Hello")
    memory_store.save_message(session_id, user_id, "assistant", "Hi there")

    assert len(memory_store.get_chat_history(session_id, user_id)) == 2

    cleared_count = memory_store.clear_history(session_id, user_id)
    assert cleared_count == 2
    assert len(memory_store.get_chat_history(session_id, user_id)) == 0
