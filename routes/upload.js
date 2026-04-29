import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadFile, indexUrl, ingestText } from '../controllers/uploadController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

const router = express.Router();

router.post('/upload', upload.single('file'), uploadFile);
router.post('/index-url', indexUrl);
router.post('/ingest-text', ingestText);

export default router;