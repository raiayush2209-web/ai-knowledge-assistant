# AI Knowledge Assistant for Custom Documents

This project implements a Node.js backend for semantic search over custom documents using:

- Vector database: Pinecone
- Embeddings: Mistral Embed
- LLM: Mistral chat model
- Document chunking: LangChain RecursiveCharacterTextSplitter
- Frontend: React (in `client/`)

## Backend

### Start
1. Copy `.env.example` to `.env`
2. Fill in `PINECONE_API_KEY`, `PINECONE_CONTROLLER_HOST`, `MISTRAL_API_KEY`, and optionally `PINECONE_INDEX_NAME`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend:
   ```bash
   npm start
   ```

### API endpoints

- `POST /api/upload` — Upload a PDF, DOCX, TXT, MD, or HTML file
- `POST /api/index-url` — Fetch a website and index its visible text
- `POST /api/ingest-text` — Index raw text directly
- `POST /api/query` — Run semantic search and generate a context-aware answer
- `GET /api/health` — Health check

### Example `POST /api/query`

```json
{
  "query": "What is the onboarding process for the internship?",
  "topK": 5,
  "namespace": "default"
}
```

## Frontend

A minimal React frontend is scaffolded in `client/`. Install and run it separately:

```bash
cd client
npm install
npm run dev
```

During development, Vite proxies `/api` requests to `http://localhost:4000` so the frontend can call the backend without CORS issues.

To build and serve the frontend from the backend in production:

```bash
npm install
npm run build:client
NODE_ENV=production npm start
```

The frontend uses relative `/api` paths for both dev proxying and production.

## Notes

- The backend uses efficient chunking with overlap to preserve document context.
- Pinecone stores each chunk as a vector record tagged with metadata.
- The chat model is prompted with retrieved chunks so answers are grounded in your custom documents.
