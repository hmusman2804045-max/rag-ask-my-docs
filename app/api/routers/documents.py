import time
import tempfile
import os
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Depends, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.schemas import DocumentUploadResponse
from app.api.dependencies import (
    get_pdf_extractor,
    get_chunker,
    get_embedding_engine,
    get_vector_store
)
from app.ingestion.pdf_extractor import PDFExtractor
from app.ingestion.exceptions import PDFIngestionError, InvalidPDFFormatError
from app.chunking.langchain_chunker import LangChainChunker
from app.embeddings.embedder import EmbeddingEngine
from app.storage.vector_store import VectorStore

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload & Index PDF Document"
)
@limiter.limit("5/minute")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    pdf_extractor: PDFExtractor = Depends(get_pdf_extractor),
    chunker: LangChainChunker = Depends(get_chunker),
    embedding_engine: EmbeddingEngine = Depends(get_embedding_engine),
    vector_store: VectorStore = Depends(get_vector_store)
) -> DocumentUploadResponse:
    """Uploads a PDF document, validates security boundaries, extracts text, chunks, embeds, and indexes in Chroma DB."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF documents (.pdf) are allowed."
        )

    start_time = time.time()

    try:
        content_bytes = await file.read()
        if not content_bytes or len(content_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded PDF file is empty."
            )

        # Phase 1: PDF Extraction & Validation from in-memory bytes
        extracted_doc = pdf_extractor.extract_from_bytes(content_bytes, filename=file.filename)
        doc_name = file.filename

        # Phase 2: LangChain Chunking
        chunking_payload = chunker.chunk_document_payload(extracted_doc)

        # Phase 3: Vector Embeddings
        embedded_payload = embedding_engine.embed_payload(chunking_payload)

        # Phase 4: Chroma DB Persistence
        vector_store.add_embedded_payload(embedded_payload)

        execution_time = (time.time() - start_time) * 1000

        logger.info(
            f"Successfully indexed document '{doc_name}' | "
            f"Pages: {extracted_doc.total_pages} | Chunks: {chunking_payload.total_chunks} | "
            f"Time: {execution_time:.2f}ms"
        )

        return DocumentUploadResponse(
            status="success",
            doc_name=doc_name,
            page_count=extracted_doc.total_pages,
            chunk_count=chunking_payload.total_chunks,
            char_count=chunking_payload.total_chars,
            execution_time_ms=round(execution_time, 2)
        )

    except HTTPException:
        raise
    except (ValueError, PDFIngestionError, InvalidPDFFormatError) as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PDF Validation Error: {val_err}"
        )
    except Exception as err:
        logger.error(f"Failed to process document upload '{file.filename}': {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing document: {err}"
        )

