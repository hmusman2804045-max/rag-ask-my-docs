import os
import sys
import uvicorn

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    print(f"Starting AskMyDocs RAG REST API Server on http://{host}:{port}")
    print(f"OpenAPI Swagger UI Documentation: http://{host}:{port}/docs")
    uvicorn.run("app.api.main:app", host=host, port=port, reload=True)
