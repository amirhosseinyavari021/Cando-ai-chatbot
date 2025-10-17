import asyncHandler from 'express-async-handler';
// مسیر aiRouter اکنون از داخل backend است
import { routeRequestToAI } from '../ai/adapters/aiRouter.js';

/**
 * @desc    Process a user's chat message (text or image)
 * @route   POST /api/chat
 * @access  Public
 */
const processMessage = asyncHandler(async (req, res) => {
  // فیلد جدید imageBase64 را از body دریافت می‌کنیم
  const { prompt, imageBase64, userId } = req.body;

  if (!prompt && !imageBase64) {
    res.status(400);
    throw new Error('Prompt or image is required.');
  }

  const result = await routeRequestToAI({
    prompt: prompt || 'Please describe this image.', // اگر متنی نبود، یک پرامپت پیش‌فرض می‌دهیم
    imageBase64, // ارسال تصویر به روتر
    userId: userId || (req.user ? req.user._id : 'anonymous')
  });

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(503).json({
      success: false,
      message: result.response,
      error: result.error,
    });
  }
});

export { processMessage };