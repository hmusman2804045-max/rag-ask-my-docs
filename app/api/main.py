import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.routers import system, documents, chat

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger("askmydocs.api")

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AskMyDocs RAG REST API Server...")
    yield
    logger.info("Shutting down AskMyDocs RAG REST API Server...")


app = FastAPI(
    title="AskMyDocs RAG API",
    description="Enterprise-grade Retrieval-Augmented Generation (RAG) REST API for PDF Document Q&A with Memory & Citations.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# SlowAPI Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware for web frontend compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(system.router)
app.include_router(documents.router)
app.include_router(chat.router)

# Mount frontend assets and configure SPA fallback for single-container deployment
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
assets_dir = frontend_dist / "assets"

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="static-assets")

    @app.get("/", include_in_schema=False)
    async def serve_root():
        return FileResponse(frontend_dist / "index.html")

    @app.exception_handler(404)
    async def spa_404_handler(request: Request, exc):
        # Only fallback to index.html for non-API web routes
        if not request.url.path.startswith("/api/"):
            file_path = frontend_dist / request.url.path.lstrip("/")
            if file_path.exists() and file_path.is_file():
                return FileResponse(file_path)
            return FileResponse(frontend_dist / "index.html")
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
else:
    @app.get("/", include_in_schema=False)
    def root():
        return {
            "message": "Welcome to AskMyDocs RAG API",
            "docs": "/docs",
            "health": "/health"
        }
