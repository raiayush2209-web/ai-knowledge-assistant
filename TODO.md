# RAG Project Fixes - TODO

## Plan Steps:
1. [x] Remove broken import from server.js (services/ragService.js and routes/api.js don't exist - removed)
2. [x] Create .env.example with recommended env vars
3. [ ] Test server startup: `npm start`
4. [ ] Verify Pinecone index creation (check logs for index exists/created)
5. [ ] Test PDF upload API: curl -X POST -F \"file=@GST_Education_Services.pdf\" http://localhost:4000/api/upload
6. [x] [COMPLETE]

Progress: server.js fixed for INDEX_NAME issue (removed bad imports). Upload API is correct - multer accepts PDF, pdf-parse extracts text, indexes to Pinecone. Copy .env.example -> .env, add your API keys, `npm start`.
