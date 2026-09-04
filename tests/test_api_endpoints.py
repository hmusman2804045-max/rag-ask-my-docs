import io
import fitz  # PyMuPDF
import pytest
from fastapi.testclient import TestClient
from app.api.main import app

client = TestClient(app)


def create_sample_pdf_bytes(text: str = "AskMyDocs API test document.") -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    assert "AskMyDocs RAG API" in res.json()["message"]


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "mongodb_connected" in data
    assert "chroma_status" in data


def test_upload_document_invalid_extension():
    files = {"file": ("test.txt", b"plain text", "text/plain")}
    res = client.post("/api/v1/documents/upload", files=files)
    assert res.status_code == 400
    assert "Only PDF documents (.pdf) are allowed" in res.json()["detail"]


def test_upload_document_valid_pdf():
    pdf_bytes = create_sample_pdf_bytes("Phase 6 REST API Integration Test Document Content.")
    files = {"file": ("api_test.pdf", pdf_bytes, "application/pdf")}
    res = client.post("/api/v1/documents/upload", files=files)

    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "success"
    assert data["doc_name"] == "api_test.pdf"
    assert data["page_count"] == 1
    assert data["chunk_count"] >= 1


def test_chat_ask_invalid_empty_question():
    payload = {
        "session_id": "api_sess_1",
        "user_id": "api_user_1",
        "question": "   "
    }
    res = client.post("/api/v1/chat/ask", json=payload)
    assert res.status_code == 400
    assert "Question cannot be empty" in res.json()["detail"]


def test_chat_ask_and_history_workflow():
    session_id = "api_sess_flow"
    user_id = "api_user_flow"

    # Ask Question
    payload = {
        "session_id": session_id,
        "user_id": user_id,
        "question": "What is the content of api_test.pdf?",
        "n_chunks": 2
    }
    ask_res = client.post("/api/v1/chat/ask", json=payload)
    assert ask_res.status_code == 200
    ask_data = ask_res.json()
    assert ask_data["session_id"] == session_id
    assert "answer" in ask_data
    assert "citations" in ask_data

    # Retrieve Chat History
    hist_res = client.get(f"/api/v1/chat/history/{session_id}?user_id={user_id}")
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert hist_data["message_count"] == 2

    # Clear Chat History
    del_res = client.delete(f"/api/v1/chat/history/{session_id}?user_id={user_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"
