import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { uploadFile, indexUrl, ingestText } from '../controllers/uploadController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists (synchronously on startup)
if (!existsSync(uploadsDir)) {
  try {
    mkdir(uploadsDir, { recursive: true }).catch(err => {
      console.warn(`[MULTER] Failed to create uploads directory: ${err.message}`);
    });
  } catch (err) {
    console.warn(`[MULTER] Error checking uploads directory: ${err.message}`);
  }
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

const router = express.Router();

const uploadFields = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'files', maxCount: 10 },
]);

router.post('/upload', uploadFields, uploadFile);
router.post('/index-url', indexUrl);
router.post('/ingest-text', ingestText);

export default router;