import asyncHandler from 'express-async-handler';
import { routeRequestToAI } from '../../ai/adapters/aiRouter.js';

/**
 * @desc    Process a user's chat message
 * @route   POST /api/chat
 * @access  Public
 */
const processMessage = asyncHandler(async (req, res) => {
  const { prompt, imageUrl, userId } = req.body;

  if (!prompt) {
    res.status(400);
    throw new Error('Prompt is required.');
  }

  const result = await routeRequestToAI({
    prompt,
    imageUrl,
    userId: userId || (req.user ? req.user._id : 'anonymous')
  });

  if (result.success) {
    res.status(200).json(result);
  } else {
    // The AI router already provides a user-friendly generic message
    res.status(503).json({
      success: false,
      message: result.response,
      error: result.error, // For internal logging, not necessarily for the user
    });
  }
});

export { processMessage };