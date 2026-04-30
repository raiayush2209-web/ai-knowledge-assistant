import { getPineconeIndex } from '../config/database.js';
import { config } from '../config/environment.js';
import { createChunks, embedChunks, embedQuery } from './embedding.js';
import { normalizeSource } from '../utils/helpers.js';

export const indexDocument = async ({ source, text, metadata = {}, namespace = config.DEFAULT_NAMESPACE }) => {
  if (!text) throw new Error('No text to index');

  const namespaceIndex = getPineconeIndex(namespace);
  const sourceKey = normalizeSource(source || 'document');
  const chunks = await createChunks(text);
  const embedded = await embedChunks(chunks);

  const records = embedded.map(({ chunk, vector }, index) => ({
    id: `${sourceKey}_${index}_${Date.now()}`,
    values: vector,
    metadata: {
      source,
      chunk,
      length: chunk.length,
      ...metadata,
    },
  }));

  await namespaceIndex.upsert({ records });
  return { indexedChunks: records.length, source, namespace, sourceKey };
};

export const searchIndex = async ({ query, namespace = config.DEFAULT_NAMESPACE, topK = 5 }) => {
  const index = getPineconeIndex(namespace);
  const queryVector = await embedQuery(query);
  const result = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  return (result.matches || []).map((match) => ({
    id: match.id,
    score: match.score,
    metadata: match.metadata,
  }));
};