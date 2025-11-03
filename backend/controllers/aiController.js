const asyncHandler = require('express-async-handler');
const aiRouter = require('../services/aiRouter');
const {
  getConversationHistory,
  addMessage,
} = require('../services/conversationMemory');

// New imports
const { detectLanguage, inferRoleSlug } = require('../utils/nlu');
const sanitizeOutput = require('../utils/sanitizeOutput');
const Roadmap = require('../models/Roadmap');

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
      // Send structured data for the frontend to render
      const responsePayload = {
        type: 'roadmap',
        data: roadmap,
        lang: lang,
      };

      await addMessage(conversationId, 'user', message);
      await addMessage(conversationId, 'bot', responsePayload); // Store object in history

      return res.json({
        message: responsePayload, // Send object to frontend
        conversationId: conversationId,
      });

    } else {
      // --- Role Detected, Roadmap NOT Found ---
      // Respond with polite "not added yet" message in the user's language
      const text =
        lang === 'fa'
          ? 'الان این مسیر هنوز اضافه نشده؛ می‌خوای برات بررسی کنم؟'
          : 'That roadmap isn’t added yet; want me to check and add it for you?';

      // Sanitize this fallback response
      const sanitizedText = sanitizeOutput(text);

      await addMessage(conversationId, 'user', message);
      await addMessage(conversationId, 'bot', sanitizedText);

      return res.json({
        message: sanitizedText, // Send as plain text
        conversationId: conversationId,
      });
    }
  }

  // 3. --- No Roadmap Intent ---
  // Proceed to general AI logic as before
  const history = await getConversationHistory(conversationId);
  const aiResult = await aiRouter.handle(message, history); // e.g., { text: '...' }

  // 4. Sanitize the *final AI output*
  const sanitizedResponse = sanitizeOutput(aiResult.text);

  await addMessage(conversationId, 'user', message);
  await addMessage(conversationId, 'bot', sanitizedResponse);

  res.json({
    message: sanitizedResponse, // Send the sanitized text
    conversationId: aiResult.conversationId || conversationId,
  });
});

module.exports = { getAIResponse };