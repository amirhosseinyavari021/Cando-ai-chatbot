import asyncHandler from 'express-async-handler';
import { routeRequestToAI } from '../ai/adapters/aiRouter.js';

/**
 * @desc    Process a user's text chat message
 * @route   POST /api/chat
 * @access  Public (pending auth implementation)
 */
const processMessage = asyncHandler(async (req, res) => {
  // Only expect 'prompt' and optionally 'userId'
  const { prompt, userId } = req.body;

  // ImageBase64 removed from validation
  if (!prompt || !prompt.trim()) {
    res.status(400);
    throw new Error('Prompt is required.');
  }

  const result = await routeRequestToAI({
    prompt,
    // imageBase64 removed
    userId: userId || (req.user ? req.user._id : 'anonymous')
  });

  if (result.success) {
    res.status(200).json(result);
  } else {
    // Determine status code based on error type if possible
    const statusCode = result.error && result.error.includes('unreachable') ? 503 : 500;
    res.status(statusCode).json({
      success: false,
      message: result.response, // User-friendly message from aiRouter
      error: result.error, // Detailed error for logging
    });
  }
});

export { processMessage };