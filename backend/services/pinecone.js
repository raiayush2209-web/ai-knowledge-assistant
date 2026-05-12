import { getPineconeIndex } from '../config/database.js';
import { config } from '../config/environment.js';
import { createChunks, embedChunks, embedQuery } from './embedding.js';
import { normalizeSource } from '../utils/helpers.js';

const TTL_SECONDS = Number(process.env.PINECONE_TTL_SECONDS || 3600);
const pendingDeletions = new Map();

const scheduleDocumentDeletion = (namespace, documentId, ids, ttlSeconds) => {
  if (!ids || !ids.length) return;
  if (pendingDeletions.has(documentId)) {
    clearTimeout(pendingDeletions.get(documentId));
    pendingDeletions.delete(documentId);
  }

  const timeout = setTimeout(async () => {
    try {
      const index = getPineconeIndex(namespace);
      await index.deleteMany({ ids });
      console.log(`[PINECONE] Deleted expired document ${documentId} from namespace ${namespace}`);
    } catch (error) {
      console.warn(`[PINECONE] Failed to delete expired document ${documentId}: ${error.message}`);
    } finally {
      pendingDeletions.delete(documentId);
    }
  }, ttlSeconds * 1000);

  pendingDeletions.set(documentId, timeout);
};

export const indexDocument = async ({ source, text, metadata = {}, namespace = config.DEFAULT_NAMESPACE, ttlSeconds = TTL_SECONDS }) => {
  if (!text) throw new Error('No text to index');

  const namespaceIndex = getPineconeIndex(namespace);
  const sourceKey = normalizeSource(source || 'document');
  const documentId = metadata.documentId || `${sourceKey}_${Date.now()}`;
  const expiryTimestamp = Date.now() + ttlSeconds * 1000;
  const chunks = await createChunks(text);
  const embedded = await embedChunks(chunks);

  const records = embedded.map(({ chunk, vector }, index) => ({
    id: `${sourceKey}_${index}_${Date.now()}`,
    values: vector,
    metadata: {
      documentId,
      source,
      filename: metadata.filename || source,
      chunk,
      length: chunk.length,
      expiryTimestamp,
      ...metadata,
    },
  }));

  await namespaceIndex.upsert({ records });
  scheduleDocumentDeletion(namespace, documentId, records.map((record) => record.id), ttlSeconds);

  return { indexedChunks: records.length, source, namespace, sourceKey, documentId, expiryTimestamp };
};

export const cleanupExpiredDocuments = async (namespace = config.DEFAULT_NAMESPACE) => {
  const index = getPineconeIndex(namespace);
  const now = Date.now();
  try {
    await index.deleteMany({ filter: { expiryTimestamp: { $lt: now } } });
    console.log(`[PINECONE] Cleaned up expired records in namespace ${namespace}`);
  } catch (error) {
    console.warn(`[PINECONE] Cleanup failed for expired records: ${error.message}`);
  }
};

export const searchIndex = async ({ query, namespace = config.DEFAULT_NAMESPACE, topK = 5 }) => {
  const index = getPineconeIndex(namespace);
  await cleanupExpiredDocuments(namespace);
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