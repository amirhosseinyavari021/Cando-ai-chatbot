import asyncHandler from 'express-async-handler';
// FIX: ایمپورت تابع صحیح از aiRouter
import { routeRequest } from '../services/aiRouter.js';
import {
  // FIX: استفاده از نام‌های توابع یکسان‌سازی شده
  getMemory,
  updateMemory,
} from '../services/conversationMemory.js';

// ایمپورت‌های مربوط به NLU و Roadmap
import { detectLanguage, inferRoleSlug } from '../utils/nlu.js';
import sanitizeOutput from '../utils/sanitizeOutput.js';
import Roadmap from '../models/Roadmap.js';

/**
 * @desc    دریافت پاسخ AI یا داده ساختاریافته roadmap
 * @route   POST /api/ai/chat (یا /api/ai/ask)
 * @access  Public
 */
const getAIResponse = asyncHandler(async (req, res) => {
  const { message, conversationId } = req.body;

  // ۱. اجرای NLU
  const lang = detectLanguage(message);
  const roleSlug = inferRoleSlug(message);

  // ۲. بررسی هدف Roadmap
  if (roleSlug) {
    const roadmap = await Roadmap.findOne({ role_slug: roleSlug, language: lang });

    if (roadmap) {
      // --- Roadmap پیدا شد ---
      const responsePayload = {
        type: 'roadmap',
        data: roadmap,
        lang: lang,
      };

      // FIX: استفاده از updateMemory
      await updateMemory(conversationId, { role: 'user', content: message });
      await updateMemory(conversationId, { role: 'bot', content: responsePayload });

      return res.json({
        message: responsePayload,
        conversationId: conversationId,
      });

    } else {
      // --- رول شناسایی شد، Roadmap موجود نیست ---
      const text =
        lang === 'fa'
          ? 'الان این مسیر هنوز اضافه نشده؛ می‌خوای برات بررسی کنم؟'
          : 'That roadmap isn’t added yet; want me to check and add it for you?';

      const sanitizedText = sanitizeOutput(text);

      // FIX: استفاده از updateMemory
      await updateMemory(conversationId, { role: 'user', content: message });
      await updateMemory(conversationId, { role: 'bot', content: sanitizedText });

      return res.json({
        message: sanitizedText,
        conversationId: conversationId,
      });
    }
  }

  // ۳. --- هدف Roadmap نبود ---
  // ارجاع به AI عمومی (aiRouter)
  // aiRouter خودش تاریخچه را مدیریت می‌کند و لاگ می‌زند.

  // FIX: فراخوانی تابع صحیح (routeRequest) و پاس دادن conversationId به عنوان userId
  const aiResult = await routeRequest(message, conversationId);

  // ۴. ضدعفونی کردن خروجی نهایی AI
  const sanitizedResponse = sanitizeOutput(aiResult.text);

  res.json({
    message: sanitizedResponse, // ارسال متن ضدعفونی شده
    conversationId: conversationId,
  });
});

// FIX: اکسپورت نام تابع صحیح که aiRoutes.js انتظار دارد
export { getAIResponse };