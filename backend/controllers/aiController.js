import asyncHandler from 'express-async-handler';
import aiRouter from '../services/aiRouter.js';
import {
  getConversationHistory,
  addMessage,
} from '../services/conversationMemory.js';

// New imports
import { detectLanguage, inferRoleSlug } from '../utils/nlu.js';
import sanitizeOutput from '../utils/sanitizeOutput.js';
import Roadmap from '../models/Roadmap.js';

/**
 * @desc    Get AI response or structured roadmap data
 * @route   POST /api/ai/chat
 * @access  Public
 */
const getAIResponse = asyncHandler(async (req, res) => {
  const { message, conversationId } = req.body;

  // 1. Run NLU checks
  const lang = detectLanguage(message);
  const roleSlug = inferRoleSlug(message);

  // 2. Check for Roadmap Intent
  if (roleSlug) {
    const roadmap = await Roadmap.findOne({ role_slug: roleSlug, language: lang });

    if (roadmap) {
      // --- Roadmap Found ---
      const responsePayload = {
        type: 'roadmap',
        data: roadmap,
        lang: lang,
      };

      await addMessage(conversationId, 'user', message);
      await addMessage(conversationId, 'bot', responsePayload);

      return res.json({
        message: responsePayload,
        conversationId: conversationId,
      });

    } else {
      // --- Role Detected, Roadmap NOT Found ---
      const text =
        lang === 'fa'
          ? 'الان این مسیر هنوز اضافه نشده؛ می‌خوای برات بررسی کنم؟'
          : 'That roadmap isn’t added yet; want me to check and add it for you?';

      const sanitizedText = sanitizeOutput(text);

      await addMessage(conversationId, 'user', message);
      await addMessage(conversationId, 'bot', sanitizedText);

      return res.json({
        message: sanitizedText,
        conversationId: conversationId,
      });
    }
  }

  // 3. --- No Roadmap Intent ---
  const history = await getConversationHistory(conversationId);
  const aiResult = await aiRouter.handle(message, history);

  // 4. Sanitize the *final AI output*
  const sanitizedResponse = sanitizeOutput(aiResult.text);

  await addMessage(conversationId, 'user', message);
  await addMessage(conversationId, 'bot', sanitizedResponse);

  res.json({
    message: sanitizedResponse,
    conversationId: aiResult.conversationId || conversationId,
  });
});

export { getAIResponse };