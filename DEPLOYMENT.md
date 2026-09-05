# AskMyDocs AI — Production Deployment Runbook

This guide covers deploying **AskMyDocs AI** to **Render.com** (Docker) with **MongoDB Atlas Vector Search** and **Cloudflare DNS**.

---

## 📋 Architecture Overview

- **Vector Store & Chat History**: MongoDB Atlas (`askmydocs.document_chunks` and `askmydocs.conversations`).
- **LLM Inference**: Groq Cloud API (`llama-3.3-70b-versatile`).
- **Full-Stack Application**: Multi-stage Docker container running FastAPI + bundled React Three.js SPA.
- **Hosting**: Render.com Web Service (Docker runtime).
- **Domain & SSL**: Cloudflare DNS.

---

## 🛠️ Step 1: Configure MongoDB Atlas Vector Search Index

Because vector storage lives in MongoDB Atlas (reusing your trusted M0 cluster from Phase 4), documents and embeddings persist permanently across cloud redeploys without local disk storage.

### 1. Create the Vector Search Index
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Navigate to **Atlas Search** (or **Search**) $\rightarrow$ **Create Search Index**.
3. Select **Atlas Vector Search** $\rightarrow$ **JSON Editor**.
4. Select database `askmydocs` and collection `document_chunks`.
5. Paste the following JSON definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "vector",
      "numDimensions": 384,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "doc_name"
    }
  ]
}
```

6. Name the index: `vector_index`.
7. Click **Create Search Index**. The status will show *Building* and then *Active* within 1–2 minutes.

---

## 🚀 Step 2: Deploy to Render.com

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository: `https://github.com/hmusman2804045-max/rag-ask-my-docs`.
4. Configure the service settings:
   - **Name**: `askmydocs-ai`
   - **Region**: Choose the closest region (e.g., Frankfurt / Oregon / Singapore).
   - **Branch**: `develop` or `main`.
   - **Runtime**: **Docker**.
   - **Instance Type**: **Free**.
5. Add the **Environment Variables** in the Render settings:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority` | Your MongoDB Atlas connection URI |
| `GROQ_API_KEY` | `gsk_...` | Your Groq Cloud API Key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | LLM model name |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence-transformers model |
| `ENVIRONMENT` | `production` | Production mode flag |

6. Click **Create Web Service**.
7. Render will automatically pull the Dockerfile, run the multi-stage build, and launch the service.

---

## 🌐 Step 3: Connect Custom Domain with Cloudflare DNS

1. In the Render Dashboard under **Settings** $\rightarrow$ **Custom Domains**, add your domain (e.g., `docs.yourdomain.com`).
2. Copy the CNAME target provided by Render (e.g., `askmydocs-ai.onrender.com`).
3. In your **Cloudflare Dashboard**:
   - Go to **DNS** $\rightarrow$ **Records** $\rightarrow$ **Add Record**.
   - **Type**: `CNAME`
   - **Name**: `docs` (or your subdomain)
   - **Target**: `askmydocs-ai.onrender.com`
   - **Proxy status**: Initially set to **DNS Only** (Grey Cloud) during Render SSL verification.
4. Once Render shows the certificate is **Issued / Verified**, switch the Cloudflare proxy to **Proxied** (Orange Cloud) for CDN caching and DDoS protection.

---

## 🧪 Step 4: Post-Deployment Verification Checklist

Verify your live deployment with these sanity checks:

- [ ] **Health Endpoint**: Navigate to `https://<your-domain>/api/v1/system/health`. Confirm `"mongodb_connected": true` and `"vector_store_connected": true`.
- [ ] **Frontend 3D UI**: Navigate to `https://<your-domain>/`. Verify the 3D Quantum Codex renders with smooth motion and crisp typography.
- [ ] **PDF Ingestion**: Drop a PDF in the ingestion panel. Verify chunks are indexed and visible in the repository list.
- [ ] **Conversational Greeting**: Type `"hello"`. Verify a polite, warm assistant response.
- [ ] **Grounded Document Q&A**: Ask a question answerable by the uploaded PDF. Verify the answer is accompanied by page citation tags.
- [ ] **Citation Drawer**: Click a citation tag. Verify the drawer opens with the exact source chunk text.
- [ ] **Session Persistence**: Refresh the browser. Verify conversation history and active session persist seamlessly from MongoDB Atlas.

---

## 📝 Known Limitations (for Documentation)

- **Free-Tier Spin Down**: Render free instances spin down after 15 minutes of inactivity. Initial wake-up takes ~30 seconds.
- **Rate Limits**: Configured to 10 requests/minute per IP to prevent quota exhaustion.
- **Mock Mode**: If external LLM API rate limits are exceeded, the system automatically falls back to citation-only responses with an active indicator.
