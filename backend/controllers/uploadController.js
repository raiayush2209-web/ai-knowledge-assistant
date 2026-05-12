import fs from 'fs/promises';
import path from 'path';
import { extractTextFromFile, extractTextFromUrl } from '../services/textExtraction.js';
import { indexDocument } from '../services/pinecone.js';
import { config } from '../config/environment.js';

export const uploadFile = async (req, res) => {
  const uploadedFiles = [];
  if (req.file) uploadedFiles.push(req.file);
  if (req.files?.file) uploadedFiles.push(...req.files.file);
  if (req.files?.files) uploadedFiles.push(...req.files.files);

  try {
    if (!uploadedFiles.length) {
      console.error('[UPLOAD] No file provided');
      return res.status(400).json({ error: 'Missing file upload.' });
    }

    // Validate that files were actually written to disk
    for (const file of uploadedFiles) {
      if (!file.path) {
        console.error(`[UPLOAD] File ${file.originalname} has no path - multer failed to save`);
        return res.status(500).json({ error: 'File upload failed - unable to save files to disk. Check server permissions.' });
      }
    }

    const namespace = req.body.namespace || config.DEFAULT_NAMESPACE;
    const results = [];

    for (const file of uploadedFiles) {
      const source = req.body.source || file.originalname;
      console.log(`[UPLOAD] File: ${file.originalname}, size: ${file.size}, path: ${file.path}`);

      let text;
      try {
        text = await extractTextFromFile(file.path, file.originalname);
        console.log(`[UPLOAD] Extracted ${text.length} chars from ${file.originalname}`);
      } catch (extractError) {
        console.error('[UPLOAD] Text extraction error:', extractError);
        console.error('[UPLOAD] Text extraction stack:', extractError.stack);
        results.push({ filename: file.originalname, success: false, error: extractError.message });
        continue;
      }

      if (!text || text.trim().length === 0) {
        results.push({ filename: file.originalname, success: false, error: 'No readable text found in file' });
        continue;
      }

      try {
        const indexResult = await indexDocument({
          source,
          text,
          metadata: { filename: file.originalname },
          namespace,
        });
        console.log(`[UPLOAD] Successfully indexed ${file.originalname} with ${indexResult.indexedChunks} chunks`);
        results.push({
          filename: file.originalname,
          success: true,
          indexedChunks: indexResult.indexedChunks,
          source,
          namespace,
        });
      } catch (indexError) {
        console.error('[UPLOAD] Indexing error:', indexError.message);
        results.push({ filename: file.originalname, success: false, error: indexError.message });
      }
    }

    const successCount = results.filter((item) => item.success).length;
    const allFailed = successCount === 0;
    const responseStatus = allFailed ? 500 : 200;

    return res.status(responseStatus).json({
      success: !allFailed,
      files: results,
      totalFiles: uploadedFiles.length,
      successfulFiles: successCount,
    });
  } catch (error) {
    console.error('[UPLOAD] Error:', error.message);
    console.error('[UPLOAD] Stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  } finally {
    const cleanupFiles = uploadedFiles.length ? uploadedFiles : [];
    for (const file of cleanupFiles) {
      if (file.path) {
        try {
          await fs.unlink(file.path);
          console.log(`[UPLOAD] Cleaned up temporary file: ${file.path}`);
        } catch (unlinkError) {
          console.warn(`[UPLOAD] Failed to clean up file: ${unlinkError.message}`);
        }
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