import { searchIndex } from '../services/pinecone.js';
import { generateAnswer, generateComparison } from '../services/embedding.js';
import { config } from '../config/environment.js';

export const queryDocuments = async (req, res) => {
  try {
    const { query, namespace, topK = 5 } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query text.' });

    const matches = await searchIndex({ query, namespace, topK });
    const answer = await generateAnswer(query, matches);
    return res.json({ success: true, query, answer, matches });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const compareDocuments = async (req, res) => {
  try {
    const { query, namespace, topK = 50 } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing comparison query text.' });

    // Get more matches for comparison to ensure we have content from multiple sources
    const matches = await searchIndex({ query, namespace, topK });
    const comparison = await generateComparison(query, matches);
    return res.json({ success: true, query, comparison, matches });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const healthCheck = async (req, res) => {
  res.json({ success: true, status: 'ok', index: config.INDEX_NAME });
};