import express from 'express';
import { queryDocuments, compareDocuments } from '../controllers/queryController.js';

const router = express.Router();

router.post('/query', queryDocuments);
router.post('/compare', compareDocuments);
export default router;