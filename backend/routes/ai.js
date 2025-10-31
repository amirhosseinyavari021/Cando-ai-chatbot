// backend/routes/ai.js

import express from "express";
import { askQuestion } from "../controllers/aiController.js";

const router = express.Router();

// 🧠 مسیر اصلی برای دریافت پیام از کاربر
router.post("/ask", askQuestion);

export default router;
