import os
import sys
import uvicorn

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 10000))
    is_dev = os.getenv("ENVIRONMENT", "development").lower() != "production"

    print(f"Starting AskMyDocs RAG REST API Server on http://{host}:{port} (env: {'dev' if is_dev else 'prod'})")
    print(f"OpenAPI Swagger UI Documentation: http://{host}:{port}/docs")

    uvicorn.run(
        "app.api.main:app",
        host=host,
        port=port,
        reload=is_dev
    )
