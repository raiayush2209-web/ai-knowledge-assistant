import { Pinecone } from '@pinecone-database/pinecone';
import { config } from './environment.js';

export const pinecone = new Pinecone({
  apiKey: config.PINECONE_API_KEY,
});

export const getPineconeIndex = (namespace = config.DEFAULT_NAMESPACE) =>
  pinecone.index({ name: config.INDEX_NAME, namespace });

export const ensurePineconeIndex = async () => {
  const indexList = await pinecone.listIndexes();
  const indexes = indexList.indexes || [];
  const exists = indexes.some((index) => index.name === config.INDEX_NAME);
  if (exists) {
    console.log(`Pinecone index "${config.INDEX_NAME}" already exists.`);
    return;
  }

  console.log(`Creating Pinecone index "${config.INDEX_NAME}" with dimension ${config.PINECONE_DIMENSION}...`);
  await pinecone.createIndex({
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