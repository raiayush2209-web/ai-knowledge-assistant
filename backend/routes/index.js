import express from 'express';
import uploadRoutes from './upload.js';
import queryRoutes from './query.js';
import { authenticate } from '../middleware/auth.js';
import { healthCheck } from '../controllers/queryController.js';

const router = express.Router();

// API routes
router.get('/api/health', healthCheck);
router.use('/api', authenticate, uploadRoutes);
router.use('/api', authenticate, queryRoutes);

export default router;