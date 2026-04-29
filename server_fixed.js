import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import axios from 'axios';
import * as cheerio from 'cheerio';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const pdfParse = require('pdf-parse');
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { MistralAIEmbeddings, ChatMistralAI } from '@langchain/mistralai';
import { Pinecone } from '@pinecone-database/pinecone';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const PORT = process.env.PORT || 4000;
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'ai-knowledge-assistant';
const DEFAULT_NAMESPACE = process.env.PINECONE_NAMESPACE || '';
const CHAT_MODEL = process.env.MISTRAL_CHAT_MODEL || 'mistral-small';
const EMBED_MODEL = process.env.MISTRAL_EMBED_MODEL || 'mistral-embed';
const PINECONE_DIMENSION = Number(process.env.PINECONE_DIMENSION || 1536);
const PINECONE_METRIC = process.env.PINECONE_METRIC || 'cosine';
const PINECONE_SERVERLESS_CLOUD = process.env.PINECONE_SERVERLESS_CLOUD || 'aws';
const PINECONE_SERVERLESS_REGION = process.env.PINECONE_SERVERLESS_REGION || 'us-east-1';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  controllerHostUrl: process.env.PINECONE_CONTROLLER_HOST,
});

const embeddings = new MistralAIEmbeddings({
  apiKey: process.env.MISTRAL_API_KEY,
  model: EMBED_MODEL,
});

const chatModel = new ChatMistralAI({
  apiKey: process.env.MISTRAL_API_KEY,
  modelName: CHAT_MODEL,
  temperature: 0.2,
  maxTokens: 1024,
});

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 150,
});

const cleanText = (text) => text.replace(/\\s+/g, ' ').trim();
const normalizeSource = (source) => source.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);

const getPineconeIndex = (namespace = DEFAULT_NAMESPACE) =>
  pinecone.index({ name: INDEX_NAME, namespace });

const ensurePineconeIndex = async () => {
  const indexList = await pinecone.listIndexes();
  const indexes = indexList.indexes || [];
  const exists = indexes.some((index) => index.name === INDEX_NAME);
  if (exists) {
    console.log(`Pinecone index "${INDEX_NAME}" already exists.`);
    return;
  }

  console.log(`Creating Pinecone index "${INDEX_NAME}" with dimension ${PINECONE_DIMENSION}...`);
  await pinecone.createIndex({
    name: INDEX_NAME,
    dimension: PINECONE_DIMENSION,
    metric: PINECONE_METRIC,
    spec: {
      serverless: {
        cloud: PINECONE_SERVERLESS_CLOUD,
        region: PINECONE_SERVERLESS_REGION,
      },
    },
  });
  console.log(`Pinecone index "${INDEX_NAME}" created.`);
};

const fileTypeFromName = (filename) => {
  const ext = path.extname(filename || '').toLowerCase();
  return ext;
};

const extractTextFromFile = async (filePath, filename) => {
  const extension = fileTypeFromName(filename);
  const buffer = await fs.readFile(filePath);

  try {
    if (extension === '.pdf') {
      console.log('[PDF] Parsing...');
      let data = typeof pdfParse === 'function' ? await pdfParse(buffer) : await pdfParse.default(buffer);
      console.log('[PDF] Success, length:', data.text?.length || 0);
      return cleanText(data.text || '');
    }

    if (extension === '.docx') {
      console.log('[DOCX] Parsing...');
      const data = await mammoth.extractRawText({ buffer });
      return cleanText(data.value || '');
    }

    if (extension === '.txt' || extension === '.md') {
      return cleanText(buffer.toString('utf-8'));
    }

    if (extension === '.html' || extension === '.htm') {
      const html = buffer.toString('utf-8');
      const $ = cheerio.load(html);
      return cleanText($.root().text() || '');
    }

    return cleanText(buffer.toString('utf-8'));
  } catch (err) {
    console.error(`[EXTRACT] Error on ${extension}:`, err.message);
    throw err;
  }
};
 
const extractTextFromUrl = async (url) => {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'AI-Knowledge-Assistant/1.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    responseType: 'arraybuffer',
  });

  const contentType = response.headers['content-type'] || '';
  if (contentType.includes('application/pdf')) {
    let data = typeof pdfParse === 'function' ? await pdfParse(response.data) : await pdfParse.default(response.data);
    return cleanText(data.text || '');
  }

  const html = response.data.toString('utf-8');
  const $ = cheerio.load(html);
  return cleanText($.root().text() || '');
};

const createChunks = async (text) => {
  if (!text) return [];
  const chunks = await textSplitter.splitText(text);
  return chunks.filter(Boolean);
};

const embedChunks = async (chunks) => {
  const vectors = await embeddings.embedDocuments(chunks);
  return chunks.map((chunk, index) => ({ chunk, vector: vectors[index] }));
};

const indexDocument = async ({ source, text, metadata = {}, namespace = DEFAULT_NAMESPACE }) => {
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

const searchIndex = async ({ query, namespace = DEFAULT_NAMESPACE, topK = 5 }) => {
  const index = getPineconeIndex(namespace);
  const queryVector = await embeddings.embedQuery(query);
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

const buildPrompt = (query, matches) => {
  const context = matches
    .map((match, index) => {
      const source = match.metadata?.source || 'unknown';
      const preview = match.metadata?.chunk || '';
      return `=== Document ${index + 1} from ${source} ===\n${preview}`;
    })
    .join('\n\n');

  return [
    new SystemMessage(
      `You are a context-aware AI knowledge assistant. Answer user questions using only the content from the provided document excerpts. If the answer is not contained in the documents, say you could not find enough information and avoid hallucinating.`
    ),
    new HumanMessage(
      `Use the following extracted content to answer the question.\n\n${context}\n\nQuestion: ${query}`
    ),
  ];
};

const generateAnswer = async (query, matches) => {
  if (!matches.length) {
    return 'I could not find relevant information in the indexed documents. Try uploading additional documents or refining your question.';
  }

  const messages = buildPrompt(query, matches);
  const response = await chatModel.invoke(messages);
  return response?.text || response?.content || '';
};

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing file upload.' });

    const source = req.body.source || req.file.originalname;
    const namespace = req.body.namespace || DEFAULT_NAMESPACE;
    
    console.log(`[UPLOAD] File: ${req.file.originalname}, size: ${req.file.size}`);
    
    const text = await extractTextFromFile(req.file.path, req.file.originalname);
    console.log(`[UPLOAD] Extracted ${text.length} chars`);

    const data = await indexDocument({
      source,
      text,
      metadata: { filename: req.file.originalname },
      namespace,
    });

    await fs.unlink(req.file.path).catch(() => null);
    console.log(`[UPLOAD] Success`);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('[UPLOAD] Error:', error.message);
    console.error(error.stack);
    return res.status(500).json({ error: error.message });
  } finally {
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(() => null);
    }
  }
});

app.post('/api/index-url', async (req, res) => {
  try {
    const { url, source, namespace } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url parameter.' });

    const text = await extractTextFromUrl(url);
    const data = await indexDocument({
      source: source || url,
      text,
      metadata: { url },
      namespace,
    });

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/ingest-text', async (req, res) => {
  try {
    const { source, text, namespace } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text to ingest.' });

    const data = await indexDocument({
      source: source || 'manual-text',
      text,
      metadata: { source },
      namespace,
    });

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/query', async (req, res) => {
  try {
    const { query, namespace, topK = 5 } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query text.' });

    const matches = await searchIndex({ query, namespace, topK });
    const answer = await generateAnswer(query, matches);
    return res.json({ success: true, query, answer, matches });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', async (req, res) => {
  res.json({ success: true, status: 'ok', index: INDEX_NAME });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), 'client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'client/dist', 'index.html'));
  });
}

const startServer = async () => {
  await ensurePineconeIndex();
  app.listen(PORT, () => {
    console.log(`AI Knowledge Assistant backend running at http://localhost:${PORT}`);
    console.log(`Pinecone index: ${INDEX_NAME}`);
  });
};

startServer().catch((error) => {
  console.error('Startup error:', error);
  process.exit(1);
});
