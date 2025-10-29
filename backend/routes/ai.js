import express from 'express';
import { askQuestion } from '../controllers/aiController.js';
// import { protect } from '../middleware/authMiddleware.js'; // Can be added later

const router = express.Router();

// @route   POST /api/ai/ask
// @desc    Send a message to the AI
// @access  Public (for now)
router.route('/ask').post(askQuestion);

export default router;