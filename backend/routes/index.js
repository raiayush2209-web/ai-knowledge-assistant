import express from 'express';
import uploadRoutes from './upload.js';
import queryRoutes from './query.js';
import authRoutes from './auth.js';
import { listDocuments, deleteDocument } from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import { healthCheck } from '../controllers/queryController.js';

const router = express.Router();

// Health check endpoint (public)
router.get('/api/health', healthCheck);

// Auth routes (public register/login/logout, protected /me)
router.use('/api/auth', authRoutes);

// Protected RAG APIs
router.use('/api', authenticate, uploadRoutes);
router.use('/api', authenticate, queryRoutes);
router.get('/api/documents', authenticate, listDocuments);
router.delete('/api/documents/:documentId', authenticate, deleteDocument);

export default router;