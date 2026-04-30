import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 4000,
  INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'ai-knowledge-assistant-v2',
  DEFAULT_NAMESPACE: process.env.PINECONE_NAMESPACE || '',
  CHAT_MODEL: process.env.MISTRAL_CHAT_MODEL || 'mistral-small',
  EMBED_MODEL: process.env.MISTRAL_EMBED_MODEL || 'mistral-embed',
  PINECONE_DIMENSION: Number(process.env.PINECONE_DIMENSION || 1024),
  PINECONE_METRIC: process.env.PINECONE_METRIC || 'cosine',
  PINECONE_SERVERLESS_CLOUD: process.env.PINECONE_SERVERLESS_CLOUD || 'aws',
  PINECONE_SERVERLESS_REGION: process.env.PINECONE_SERVERLESS_REGION || 'us-east-1',
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_CONTROLLER_HOST: process.env.PINECONE_CONTROLLER_HOST,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development'
};