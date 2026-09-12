import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 4000,
  INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'ai-knowledge-assistant-v2',
  DEFAULT_NAMESPACE: process.env.PINECONE_NAMESPACE || '',
  CHAT_MODEL: process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:7b',
  EMBED_MODEL: process.env.OLLAMA_EMBED_MODEL || 'mxbai-embed-large',
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  PINECONE_DIMENSION: Number(process.env.PINECONE_DIMENSION || 1024),
  PINECONE_METRIC: process.env.PINECONE_METRIC || 'cosine',
  PINECONE_SERVERLESS_CLOUD: process.env.PINECONE_SERVERLESS_CLOUD || 'aws',
  PINECONE_SERVERLESS_REGION: process.env.PINECONE_SERVERLESS_REGION || 'us-east-1',
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_CONTROLLER_HOST: process.env.PINECONE_CONTROLLER_HOST,
  PINECONE_TTL_SECONDS: Number(process.env.PINECONE_TTL_SECONDS || 3600),
  OCR_MAX_PAGES: Number(process.env.OCR_MAX_PAGES || 10),
  NODE_ENV: process.env.NODE_ENV || 'development'
};