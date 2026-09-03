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

    history = memory_store.get_chat_history(session_id, limit=10)
    assert len(history) == 2
    assert history[0]["content"] == "What dataset did the project use?"
    assert history[1]["content"] == "The project used the NIH Chest X-ray dataset."


def test_memory_store_limit_retrieval(memory_store):
    session_id = "test_session_102"
    user_id = "user_xyz"

    for i in range(5):
        memory_store.save_message(session_id, user_id, "user", f"Question {i+1}")
        memory_store.save_message(session_id, user_id, "assistant", f"Answer {i+1}")

    history = memory_store.get_chat_history(session_id, limit=4)
    assert len(history) == 4
    assert history[0]["content"] == "Question 4"
    assert history[3]["content"] == "Answer 5"


def test_memory_store_clear_history(memory_store):
    session_id = "test_session_103"
    user_id = "user_clear"

    memory_store.save_message(session_id, user_id, "user", "Hello")
    memory_store.save_message(session_id, user_id, "assistant", "Hi there")

    assert len(memory_store.get_chat_history(session_id)) == 2

    cleared_count = memory_store.clear_history(session_id)
    assert cleared_count == 2
    assert len(memory_store.get_chat_history(session_id)) == 0
