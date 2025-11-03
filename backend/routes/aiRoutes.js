import express from 'express';
import asyncHandler from 'express-async-handler';
const router = express.Router();

// FIX: ایمپورت نام تابع صحیحی که در کنترلر وجود دارد
import { getAIResponse } from '../controllers/aiController.js';

// روت اصلی چت که توسط aiController.js (شامل roadmap) مدیریت می‌شود
router.route('/chat').post(asyncHandler(getAIResponse));

// روت قدیمی 'ask' را نیز به کنترلر جدید هدایت می‌کنیم
router.route('/ask').post(asyncHandler(getAIResponse));

export default router;