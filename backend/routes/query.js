import express from 'express';
import { queryDocuments, healthCheck } from '../controllers/queryController.js';

const router = express.Router();

router.post('/query', queryDocuments);
router.get('/health', healthCheck);

export default router;