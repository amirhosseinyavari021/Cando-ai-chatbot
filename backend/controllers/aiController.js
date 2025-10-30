// backend/controllers/aiController.js
import asyncHandler from 'express-async-handler';
import { routeRequest } from '../services/aiRouter.js';

/**
 * @desc    Process an AI chat message
 * @route   POST /api/ai/ask
 * @access  Public
 */
export const askQuestion = asyncHandler(async (req, res) => {
  const { message, userId, sessionId } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message is required.' });
  }

  try {
    const result = await routeRequest(
      message.trim(),
      userId || 'anonymous',
      sessionId || 'anon-session'
    );

    return res.status(200).json({
      success: true,
      message: result.text,
      fallback: result.didFallback,
    });
  } catch (error) {
    // خروجی سازگار برای UI (بدون لو دادن جزییات داخلی)
    return res.status(503).json({
      success: false,
      error: 'در حال حاضر امکان پاسخ‌گویی وجود ندارد. لطفاً کمی بعد دوباره تلاش کنید.',
    });
  }
});
