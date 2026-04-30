import express from 'express';
import uploadRoutes from './upload.js';
import queryRoutes from './query.js';

const router = express.Router();

// API routes
router.use('/api', uploadRoutes);
router.use('/api', queryRoutes);

export default router;