import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    allow_origins=["*"],  # Allows any local frontend (Vite/React/Vue/HTML) to communicate with API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(system.router)
app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/", include_in_schema=False)
def root():
    return {
        "message": "Welcome to AskMyDocs RAG API",
        "docs": "/docs",
        "health": "/health"
    }
