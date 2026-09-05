# ==========================================================
# Stage 1: Build React + Three.js Frontend SPA
# ==========================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================================
# Stage 2: Production Python 3.11 Runtime
# ==========================================================
FROM python:3.11-slim AS production

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    HOST=0.0.0.0 \
    PORT=10000 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    TOKENIZERS_PARALLELISM=false

WORKDIR /app

# Install minimal system dependencies for PyMuPDF and SSL
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install lightweight CPU-only PyTorch first (avoids 1GB+ CUDA dependencies and reduces RAM usage by 75%)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the embedding model so it doesn't spike RAM on initial startup
RUN python -c "from fastembed import TextEmbedding; TextEmbedding('sentence-transformers/all-MiniLM-L6-v2')"

# Copy backend application code
COPY app/ ./app/
COPY scripts/ ./scripts/

# Copy built frontend assets from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create non-root user for security compliance
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 10000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/api/v1/system/health || exit 1

# Start FastAPI server
CMD ["python", "scripts/run_api_server.py"]
