import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
//
// export const config = {
export const config = {
  PORT: process.env.PORT || 4000,

  INDEX_NAME:
    process.env.PINECONE_INDEX_NAME ||
    'ai-knowledge-assistant-gemini',

  DEFAULT_NAMESPACE:
    process.env.PINECONE_NAMESPACE || '',

  CHAT_MODEL:
    process.env.GEMINI_CHAT_MODEL ||
    'gemini-3.6-flash',

  EMBED_MODEL:
    process.env.GEMINI_EMBEDDING_MODEL ||
    'gemini-embedding-001',

  PINECONE_DIMENSION:
    Number(process.env.PINECONE_DIMENSION || 1024),

  PINECONE_METRIC:
    process.env.PINECONE_METRIC || 'cosine',

  PINECONE_SERVERLESS_CLOUD:
    process.env.PINECONE_SERVERLESS_CLOUD || 'aws',

  PINECONE_SERVERLESS_REGION:
    process.env.PINECONE_SERVERLESS_REGION || 'us-east-1',

  PINECONE_API_KEY:
    process.env.PINECONE_API_KEY,

  PINECONE_TTL_SECONDS:
    Number(process.env.PINECONE_TTL_SECONDS || 3600),

  OCR_MAX_PAGES:
    Number(process.env.OCR_MAX_PAGES || 10),

  NODE_ENV:
    process.env.NODE_ENV || 'development',

  GEMINI_API_KEY:
    process.env.GEMINI_API_KEY,

  JWT_SECRET:
    process.env.JWT_SECRET,

  JWT_EXPIRES_IN:
    process.env.JWT_EXPIRES_IN || '8h',

  AUTH_USERNAME:
    process.env.AUTH_USERNAME,

  AUTH_PASSWORD:
    process.env.AUTH_PASSWORD,

  FRONTEND_URL:
    process.env.FRONTEND_URL ||
    'http://localhost:5173',
};