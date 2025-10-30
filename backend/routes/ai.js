// backend/routes/ai.js
import express from 'express';
import { askQuestion } from '../controllers/aiController.js';

const router = express.Router();

// POST /api/ai/ask
router.post('/ask', askQuestion);

export default router;
