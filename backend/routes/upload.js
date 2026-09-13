import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

import {
  uploadFile,
  indexUrl,
  ingestText,
} from '../controllers/uploadController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directory
const uploadsDir =
  process.env.UPLOAD_DIR ||
  path.join(__dirname, '..', 'uploads');

// Make sure directory exists before Multer receives requests
await mkdir(uploadsDir, { recursive: true });

console.log(`[MULTER] Upload directory: ${uploadsDir}`);

// Allowed file extensions
const allowedExtensions = new Set([
  '.pdf',
  '.docx',
  '.txt',
  '.md',
  '.markdown',
  '.html',
  '.htm',
]);

// Allowed MIME types
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/html',
  'application/octet-stream',
]);

// Configure Multer
const upload = multer({
  dest: uploadsDir,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 5,
  },

  fileFilter: (req, file, cb) => {
    const extension = path
      .extname(file.originalname || '')
      .toLowerCase();

    const mimeType = file.mimetype;

    console.log(
      `[MULTER] Receiving: ${file.originalname} | MIME: ${mimeType} | EXT: ${extension}`
    );

    // Validate extension
    if (!allowedExtensions.has(extension)) {
      return cb(
        new Error(
          'Unsupported file type. Only PDF, DOCX, TXT, MD, and HTML files are allowed.'
        )
      );
    }

    // Some browsers/services send octet-stream for text files.
    // Extension validation above is therefore the primary check.
    if (
      !allowedMimeTypes.has(mimeType) &&
      !mimeType.startsWith('text/')
    ) {
      return cb(
        new Error(`Unsupported MIME type: ${mimeType}`)
      );
    }

    cb(null, true);
  },
});

const router = express.Router();

/*
 * Supports:

 * formData.append('file', file)
 *
 * OR
 *
 * formData.append('files', file)
 * formData.append('files', anotherFile)
 */
const uploadFields = upload.fields([
  {
    name: 'file',
    maxCount: 1,
  },
  {
    name: 'files',
    maxCount: 5,
  },
]);

// Upload document(s)
router.post('/upload', uploadFields, uploadFile);

// Index URL
router.post('/index-url', indexUrl);

// Ingest raw text
router.post('/ingest-text', ingestText);

export default router;