import asyncHandler from 'express-async-handler';
import { routeRequestToAI } from '../ai/adapters/aiRouter.js';
import axios from 'axios'; // Needed for CancelToken source

const processMessage = asyncHandler(async (req, res) => {
  const { prompt, userId } = req.body;

  if (!prompt || !prompt.trim()) {
    res.status(400); throw new Error('Prompt is required.');
  }

  // Create a cancel token source for this request
  const cancelTokenSource = axios.CancelToken.source();

  // Handle client disconnect (optional but good practice)
  req.on('close', () => {
    console.log('Client disconnected, cancelling OpenAI request...');
    cancelTokenSource.cancel('Client disconnected.');
  });

  try {
    const result = await routeRequestToAI({
      prompt,
      userId: userId || (req.user ? req.user._id : 'anonymous'),
      cancelTokenSource // Pass the source to the router
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      // aiRouter provides user-friendly messages now
      const statusCode = result.error && (result.error.includes('unreachable') || result.error.includes('timed out') || result.error.includes('OpenAI')) ? 503 : 500;
      res.status(statusCode).json({
        success: false,
        message: result.response,
        error: result.error,
      });
    }
  } catch (error) {
    // Handle cancellation errors specifically if thrown from aiRouter
    if (axios.isCancel(error)) {
      console.log("Request cancelled in controller.");
      // Send a specific response or just end it
      return res.status(499).json({ success: false, message: "Request cancelled" }); // 499 Client Closed Request
    }
    // Handle other unexpected errors
    console.error("Unexpected error in chatController:", error);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
});

export { processMessage };