import asyncHandler from 'express-async-handler';
import { routeRequest } from '../services/aiRouter.js';

/**
 * @desc    Process an AI chat message
 * @route   POST /api/ai/ask
 * @access  Public
 */
const askQuestion = asyncHandler(async (req, res) => {
  const { message, userId } = req.body; // Allow userId from authenticated routes later

  if (!message || !message.trim()) {
    res.status(400);
    throw new Error('Message is required.');
  }

  try {
    const result = await routeRequest(
      message,
      userId || (req.user ? req.user._id : 'anonymous')
    );

    res.status(200).json({
      success: true,
      message: result.text,
      fallback: result.didFallback,
    });
  } catch (error) {
    // The aiRouter already logged the details.
    // The errorHandler middleware will catch this.
    // Send a user-friendly error.
    res.status(503); // Service Unavailable
    throw new Error(
      'در حال حاضر دسترسی به سرویس هوش‌مصنوعی ممکن نیست. لطفاً کمی بعد دوباره تلاش کنید.'
    );
  }
});

export { askQuestion };