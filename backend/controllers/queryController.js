import { searchIndex } from '../services/pinecone.js';
import { generateAnswer, generateComparison } from '../services/embedding.js';
import { config } from '../config/environment.js';
import { checkPinecone } from '../config/database.js';
import { checkGemini } from '../services/ai/gemini.js';

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
  console.error('[QUERY ERROR]', error.message);
  return res.status(timedOut ? 504 : 500).json({ error: timedOut ? error.message : 'An error occurred while processing the query.' });
};

export const queryDocuments = async (req, res) => {
  try {
    let { query, topK = 5 } = req.body;
    const userId = req.user?.id;
    const namespace = userId ? `user_${userId}` : (req.user?.namespace || config.DEFAULT_NAMESPACE);
    if (!query) return res.status(400).json({ error: 'Missing query text.' });
    if (query.length > 1000) return res.status(400).json({ error: 'Query text is too long.' });

    topK = Math.min(Math.max(parseInt(topK) || 5, 1), 50); // Limit topK between 1 and 50

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
    let { query, topK = 100 } = req.body;
    const userId = req.user?.id;
    const namespace = userId ? `user_${userId}` : (req.user?.namespace || config.DEFAULT_NAMESPACE);
    if (!query) return res.status(400).json({ error: 'Missing comparison query text.' });
    if (query.length > 1000) return res.status(400).json({ error: 'Query text is too long.' });

    topK = Math.min(Math.max(parseInt(topK) || 100, 1), 100); // Limit topK between 1 and 100

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
  const checks = await Promise.allSettled([
    checkPinecone(),
    checkGemini(),
  ]);
  const dependencies = {
    pinecone: checks[0].status === 'fulfilled' ? 'ok' : 'unavailable',
    gemini: checks[1].status === 'fulfilled' ? 'ok' : 'unavailable',
  };
  const healthy = Object.values(dependencies).every((status) => status === 'ok');
  if (!healthy) console.warn('[HEALTH] Dependency check failed', dependencies);
  return res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'ok' : 'degraded',
    dependencies,
  });
};
