# AI Knowledge Assistant for Custom Documents

This project implements a Node.js backend for semantic search over custom documents using:

- Vector database: Pinecone
- Embeddings: OpenAI `text-embedding-3-small`
- LLM: OpenAI `gpt-4o-mini`
- Document chunking: LangChain RecursiveCharacterTextSplitter
- Frontend: React (in `frontend/`)

## Backend

### Start
1. Copy `backend/.env.example` to `backend/.env`
2. Fill in the OpenAI, Pinecone, JWT, and authentication variables.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the backend:
   ```bash
   npm start
   ```

### API endpoints

- `POST /api/upload` — Upload a PDF, DOCX, TXT, MD, or HTML file
- `POST /api/index-url` — Fetch a website and index its visible text
- `POST /api/ingest-text` — Index raw text directly
- `POST /api/query` — Run semantic search and generate a context-aware answer
- `GET /api/health` — Health check
- `POST /api/auth/login` — Obtain a bearer token

### Example `POST /api/query`

```http
Authorization: Bearer <token from /api/auth/login>
```

```json
{
  "query": "What is the onboarding process for the internship?",
   "topK": 5
}
```

## Frontend

A minimal React frontend is scaffolded in `frontend/`. Install and run it separately:

```bash
cd frontend
npm install
npm run dev
```

During development, Vite proxies `/api` requests to `http://localhost:4000` so the frontend can call the backend without CORS issues.

To build and serve the frontend from the backend in production:

```bash
cd frontend
npm install
npm run build
cd ../backend
npm start
```

The frontend uses relative `/api` paths in development and `VITE_API_BASE` in production.

## Deployment

### Backend (Render)
The backend is deployed on Render at: https://ai-knowledge-assistant-z3co.onrender.com

### Frontend (Vercel)
The frontend is deployed on Vercel and calls the Render API directly.

To deploy the frontend to Vercel:
1. Push this repository to GitHub
2. Connect the repository to Vercel
3. Set the environment variable `VITE_API_BASE=https://ai-knowledge-assistant-z3co.onrender.com` in Vercel dashboard
4. Deploy

Configure the Vercel rewrite/fallback for React Router in the Vercel dashboard or deployment configuration.
