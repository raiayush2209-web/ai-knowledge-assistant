import fs from 'fs/promises';
import { extractTextFromFile, extractTextFromUrl } from '../services/textExtraction.js';
import { indexDocument } from '../services/pinecone.js';
import { config } from '../config/environment.js';

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      console.error('[UPLOAD] No file provided');
      return res.status(400).json({ error: 'Missing file upload.' });
    }

    const source = req.body.source || req.file.originalname;
    const namespace = req.body.namespace || config.DEFAULT_NAMESPACE;

    console.log(`[UPLOAD] File: ${req.file.originalname}, size: ${req.file.size}, path: ${req.file.path}`);

    let text;
    try {
      text = await extractTextFromFile(req.file.path, req.file.originalname);
      console.log(`[UPLOAD] Extracted ${text.length} chars`);
    } catch (extractError) {
      console.error('[UPLOAD] Text extraction error:', extractError.message);
      throw new Error(`Text extraction failed: ${extractError.message}`);
    }

    if (!text || text.trim().length === 0) {
  return res.status(400).json({
    error: "No readable text found in file"
  });
}

    let indexResult;
    try {
      indexResult = await indexDocument({
        source,
        text,
        metadata: { filename: req.file.originalname },
        namespace,
      });
      console.log(`[UPLOAD] Successfully indexed with ${indexResult.indexedChunks} chunks`);
    } catch (indexError) {
      console.error('[UPLOAD] Indexing error:', indexError.message);
      throw new Error(`Indexing failed: ${indexError.message}`);
    }

    return res.json({ success: true, data: indexResult });
  } catch (error) {
    console.error('[UPLOAD] Error:', error.message);
    console.error('[UPLOAD] Stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  } finally {
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
        console.log(`[UPLOAD] Cleaned up temporary file: ${req.file.path}`);
      } catch (unlinkError) {
        console.warn(`[UPLOAD] Failed to clean up file: ${unlinkError.message}`);
      }
    }
  }
};

export const indexUrl = async (req, res) => {
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
};

export const ingestText = async (req, res) => {
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
};