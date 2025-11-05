import asyncHandler from 'express-async-handler';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai'; // OpenAI import remains for potential future use

// --- Config ---
import config from '../config/ai.js';

// --- Services ---
import { routeRequest } from '../services/aiRouter.js'; // This is the RAG router
import { updateMemory } from '../services/conversationMemory.js';
import logger from '../middleware/logger.js';

// --- Utils ---
import { detectLanguage } from '../utils/nlu.js';
import sanitizeOutput from '../utils/sanitizeOutput.js';

// --- (DELETED) Restricted Mode Imports are gone ---
// const { systemMessage, ... } = '../ai/promptTemplate.js';
// const { detectIntent, ... } = '../utils/contextUtils.js';

// Setup OpenAI instance (Still useful for other parts)
let openai;
if (config.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
} else {
  logger.error('❌ Missing OPENAI_API_KEY in .env. AI features will fail.');
}

/**
 * @desc    Get AI response (Simplified logic)
 * @route   POST /api/ai/chat (or /api/ai/ask, /api/chat/stream)
 * @access  Public
 */
const getAIResponse = asyncHandler(async (req, res) => {
  // --- Read message from both "message" (new) and "text" (old frontend) ---
  const { conversationId: reqConvId } = req.body;
  const message = req.body.message || req.body.text;
  const conversationId = reqConvId || uuidv4();

  if (!message) {
    logger.error('[400] Request failed: "Empty message". Body:', req.body);
    return res.status(400).json({ error: 'Empty message' });
  }

  // ===================================================================
  // --- (DELETED) AI RESTRICTED MODE ---
  // ===================================================================
  // The 'if (config.AI_RESTRICT_MODE)' block has been completely removed.
  // All requests now fall through to the legacy RAG router.

  // ===================================================================
  // ---  Legacy: Unrestricted Mode (Now the default) ---
  // ===================================================================
  logger.info('[RAG Mode] Routing to aiRouter...');

  // 1. --- (Legacy) Check for Roadmap ---
  const { inferRoleSlug } = await import('../utils/nlu.js');
  const Roadmap = (await import('../models/Roadmap.js')).default;

  const lang = detectLanguage(message);
  const roleSlug = inferRoleSlug(message);

  if (roleSlug) {
    const roadmap = await Roadmap.findOne({ role_slug: roleSlug, language: lang });
    if (roadmap) {
      const responsePayload = { type: 'roadmap', data: roadmap, lang: lang };
      await updateMemory(conversationId, { role: 'user', content: message });
      await updateMemory(conversationId, { role: 'bot', content: responsePayload });
      // Send response in 'text' format for frontend
      return res.json({ text: responsePayload, conversationId });
    }
  }

  // 2. --- (Legacy) Call old AI Router (aiRouter.js) ---
  // This router now uses the new, strong prompt from promptTemplate.js
  const aiResult = await routeRequest(message, conversationId);
  const sanitizedResponse = sanitizeOutput(aiResult.text);

  // We still use updateMemory here, as the old controller did
  await updateMemory(conversationId, { role: 'user', content: message });
  await updateMemory(conversationId, { role: 'bot', content: sanitizedResponse });

  // Send response in 'text' format for frontend
  res.json({
    text: sanitizedResponse,
    conversationId: conversationId,
  });
});

export { getAIResponse };