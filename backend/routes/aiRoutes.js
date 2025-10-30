// ===============================
// 📁 backend/routes/aiRoutes.js
// ===============================
import express from 'express';
import { askQuestion } from '../controllers/aiController.js';
import logger from '../middleware/logger.js';

const router = express.Router();

/**
 * @route   POST /api/ai/ask
 * @desc    دریافت پرسش کاربر و ارسال به سیستم AI (OpenAI / Local)
 * @access  Public
 */
router.post('/ask', async (req, res, next) => {
  try {
    logger.info(`🧠 New AI request received: ${req.body?.message || 'EMPTY'}`);
    await askQuestion(req, res);
  } catch (error) {
    logger.error(`❌ Route /api/ai/ask failed: ${error.message}`);
    next(error);
  }
});

/**
 * @route   GET /api/ai/test
 * @desc    تست سلامت API (برای اطمینان از اتصال)
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ AI route is online and reachable.',
  });
});

export default router;
