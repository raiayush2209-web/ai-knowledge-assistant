import { Pinecone } from '@pinecone-database/pinecone';
import { config } from './environment.js';
//The Pinecone JavaScript SDK (officially released and maintained as the @pinecone-database/pinecone npm package) is a fully type-safe TypeScript/Node.js client designed for building AI-powered vector search applications, recommendation engines, and Retrieval-Augmented Generation (RAG) systems

let pinecone;

export const getPineconeClient = () => {
  if (!pinecone) {
    if (!config.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set');
    }
    pinecone = new Pinecone({
      apiKey: config.PINECONE_API_KEY,
    });
  }
  return pinecone;
};

export const getPineconeIndex = (namespace = config.DEFAULT_NAMESPACE) =>
  getPineconeClient().index({ name: config.INDEX_NAME, namespace });

export const ensurePineconeIndex = async () => {
  const client = getPineconeClient();
  const indexList = await client.listIndexes();
  const indexes = indexList.indexes || [];
  const exists = indexes.some((index) => index.name === config.INDEX_NAME);
  if (exists) {
    console.log(`Pinecone index "${config.INDEX_NAME}" already exists.`);
    return;
  }

  console.log(`Creating Pinecone index "${config.INDEX_NAME}" with dimension ${config.PINECONE_DIMENSION}...`);
  await client.createIndex({
    name: config.INDEX_NAME,
    dimension: config.PINECONE_DIMENSION,
    metric: config.PINECONE_METRIC,
    spec: {
      serverless: {
        cloud: config.PINECONE_SERVERLESS_CLOUD,
        region: config.PINECONE_SERVERLESS_REGION,
      },
    },
  });
  console.log(`Pinecone index "${config.INDEX_NAME}" created.`);
};

export const checkPinecone = async () => {
  await getPineconeClient().listIndexes();
};