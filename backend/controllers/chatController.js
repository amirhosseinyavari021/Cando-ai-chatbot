import asyncHandler from 'express-async-handler';
// FIX: The path is now one level up, not two.
import { routeRequestToAI } from '../ai/adapters/aiRouter.js';

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
    res.status(503).json({
      success: false,
      message: result.response,
      error: result.error,
    });
  }
});

export { processMessage };