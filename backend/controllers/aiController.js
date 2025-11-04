import asyncHandler from 'express-async-handler';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

// --- Config ---
import config from '../config/ai.js';

// --- Services ---
import { routeRequest } from '../services/aiRouter.js'; // Old (unrestricted) router
import { updateMemory } from '../services/conversationMemory.js';
import logger from '../middleware/logger.js';

// --- Utils ---
import { detectLanguage } from '../utils/nlu.js';
import sanitizeOutput from '../utils/sanitizeOutput.js';

// --- (NEW) Restricted Mode Imports ---
import {
  systemMessage,
  buildUserPrompt,
  getRestrictedFallback,
  getDbFallback,
} from '../ai/promptTemplate.js';
import {
  detectIntent,
  searchAcademicDB,
  formatContext,
  truncateContext,
} from '../utils/contextUtils.js';

// --- (NEW) Setup OpenAI instance ---
// We only initialize it if the key exists
let openai;
if (config.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
} else {
  logger.error('❌ Missing OPENAI_API_KEY in .env. AI features will fail.');
}

/**
 * @desc    Get AI response (handles both restricted and unrestricted modes)
 * @route   POST /api/ai/chat (or /api/ai/ask)
 * @access  Public
 */
const getAIResponse = asyncHandler(async (req, res) => {
  const { message, conversationId: reqConvId } = req.body;
  const conversationId = reqConvId || uuidv4();

  if (!message) {
    return res.status(400).json({ error: 'Empty message' });
  }

  // ===================================================================
  // --- 🛡️ NEW: AI RESTRICTED MODE ---
  // ===================================================================
  if (config.AI_RESTRICT_MODE) {
    const lang = detectLanguage(message);

    // 1. Detect Intent (Is it about Cando?)
    const intent = detectIntent(message);

    if (!intent) {
      // --- Off-topic query ---
      logger.warn(`[Restricted] Off-topic query detected: "${message}"`);
      const fallbackMsg = getRestrictedFallback(lang);
      await updateMemory(conversationId, { role: 'user', content: message });
      await updateMemory(conversationId, {
        role: 'bot',
        content: `[Fallback] ${fallbackMsg}`,
      });
      return res.json({ message: fallbackMsg, conversationId });
    }

    // 2. Search Academic DB
    const dbResults = await searchAcademicDB(intent, message);

    if (!dbResults || dbResults.length === 0) {
      // --- On-topic, but no DB results ---
      logger.warn(`[Restricted] No DB results for intent "${intent}"`);
      const dbFallbackMsg = getDbFallback(lang);
      await updateMemory(conversationId, { role: 'user', content: message });
      await updateMemory(conversationId, {
        role: 'bot',
        content: `[DB Fallback] ${dbFallbackMsg}`,
      });
      return res.json({ message: dbFallbackMsg, conversationId });
    }

    // 3. Format Context and Call AI
    const rawContext = formatContext(dbResults);
    const dbContext = truncateContext(rawContext);

    // Build the prompt (No chat history is sent, as requested)
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: buildUserPrompt(message, dbContext) },
    ];

    try {
      // --- (FIX) Add request options with timeout ---
      const requestOptions = {
        timeout: config.AI_TIMEOUT_MS || 15000, // Default to 15s
      };

      const completion = await openai.chat.completions.create(
        {
          model: config.AI_PRIMARY_MODEL,
          messages: messages,
          temperature: 0.2, // Low temp for factual, non-creative answers
          max_tokens: 250, // Keep responses concise
        },
        requestOptions // --- (FIX) Pass options as the second argument ---
      );

      const responseText =
        completion.choices[0]?.message?.content ||
        getDbFallback(lang); // Use DB fallback on AI failure

      const sanitizedResponse = sanitizeOutput(responseText);

      // Log for analysis
      await updateMemory(conversationId, { role: 'user', content: message });
      await updateMemory(conversationId, {
        role: 'bot',
        content: sanitizedResponse,
      });

      return res.json({ message: sanitizedResponse, conversationId });
    } catch (err) {
      logger.error(`[Restricted] OpenAI API Error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
    return; // End restricted mode execution
  }

  // ===================================================================
  // ---  Legacy: Unrestricted Mode ---
  // (This code runs if AI_RESTRICT_MODE is false)
  // ===================================================================
  logger.info('[Unrestricted] Routing to old aiRouter...');

  // 1. --- (Legacy) Check for Roadmap ---
  // Note: This NLU is different from the restricted mode's 'detectIntent'
  const { inferRoleSlug } = await import('../utils/nlu.js'); // Dynamic import
  const Roadmap = (await import('../models/Roadmap.js')).default; // Dynamic import

  const lang = detectLanguage(message);
  const roleSlug = inferRoleSlug(message); // Uses old NLU

  if (roleSlug) {
    const roadmap = await Roadmap.findOne({ role_slug: roleSlug, language: lang });
    if (roadmap) {
      const responsePayload = { type: 'roadmap', data: roadmap, lang: lang };
      await updateMemory(conversationId, { role: 'user', content: message });
      await updateMemory(conversationId, { role: 'bot', content: responsePayload });
      return res.json({ message: responsePayload, conversationId });
    } else {
      // ... (rest of old roadmap-not-found logic) ...
    }
  }

  // 2. --- (Legacy) Call old AI Router ---
  const aiResult = await routeRequest(message, conversationId);
  const sanitizedResponse = sanitizeOutput(aiResult.text);

  // We still use updateMemory here, as the old controller did
  await updateMemory(conversationId, { role: 'user', content: message });
  await updateMemory(conversationId, { role: 'bot', content: sanitizedResponse });

  res.json({
    message: sanitizedResponse,
    conversationId: conversationId,
  });
});

export { getAIResponse };