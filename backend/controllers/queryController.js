import { searchIndex } from '../services/pinecone.js';
import { generateAnswer, generateComparison } from '../services/embedding.js';
import { config } from '../config/environment.js';

const RETRIEVAL_TIMEOUT_MS = 30_000;
const ANSWER_TIMEOUT_MS = 60_000;

const withTimeout = (operation, timeoutMs, label) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out. Please try again.`)), timeoutMs);
  });

  return Promise.race([operation, timeout]).finally(() => clearTimeout(timeoutId));
};

const sendQueryError = (res, error) => {
  const timedOut = error.message?.includes('timed out');
  return res.status(timedOut ? 504 : 500).json({ error: error.message });
};

export const queryDocuments = async (req, res) => {
  try {
    const { query, namespace, topK = 5 } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query text.' });

    const matches = await withTimeout(
      searchIndex({ query, namespace, topK }),
      RETRIEVAL_TIMEOUT_MS,
      'Document search',
    );
    const answer = await withTimeout(
      generateAnswer(query, matches),
      ANSWER_TIMEOUT_MS,
      'Answer generation',
    );
    return res.json({ success: true, query, answer, matches });
  } catch (error) {
    return sendQueryError(res, error);
  }
};

export const compareDocuments = async (req, res) => {
  try {
    const { query, namespace, topK = 100 } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing comparison query text.' });

    // Get more matches for comparison to ensure we have content from multiple sources
    const matches = await withTimeout(
      searchIndex({ query, namespace, topK }),
      RETRIEVAL_TIMEOUT_MS,
      'Document search',
    );
    const comparison = await withTimeout(
      generateComparison(query, matches),
      ANSWER_TIMEOUT_MS,
      'Comparison generation',
    );
    return res.json({ success: true, query, comparison, matches });
  } catch (error) {
    return sendQueryError(res, error);
  }
};

export const healthCheck = async (req, res) => {
  res.json({ success: true, status: 'ok', index: config.INDEX_NAME });
};
