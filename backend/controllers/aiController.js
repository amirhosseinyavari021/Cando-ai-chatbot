// backend/controllers/aiController.js

import asyncHandler from "express-async-handler";
import { routeRequest } from "../services/aiRouter.js";

/**
 * @desc    Handle AI chat message
 * @route   POST /api/ai/ask
 * @access  Public (can be protected later)
 */
const askQuestion = asyncHandler(async (req, res) => {
  const { message, userId } = req.body;

  if (!message || !message.trim()) {
    res.status(400);
    throw new Error("پیام ارسالی خالی است.");
  }

  try {
    const result = await routeRequest(message, userId || "anonymous");

    res.status(200).json({
      success: true,
      message: result.text,
      fallback: result.didFallback,
    });
  } catch (error) {
    console.error("❌ AI Error:", error.message);
    res.status(503).json({
      success: false,
      message:
        "در حال حاضر دسترسی به سرویس هوش مصنوعی ممکن نیست. لطفاً کمی بعد دوباره تلاش کنید.",
    });
  }
});

export { askQuestion };
