import express from 'express';
import { queryDocuments, compareDocuments, healthCheck } from '../controllers/queryController.js';

const router = express.Router();

router.post('/query', queryDocuments);
router.post('/compare', compareDocuments);
router.get('/health', healthCheck);

export default router;