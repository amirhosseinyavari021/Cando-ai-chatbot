// backend/routes/aiRoutes.js
import { Router } from "express";
import { sendChat, health } from "../controllers/aiController.js";

const router = Router();

// Canonical and legacy-compatible routes
router.post("/chat", sendChat);
router.post("/ask", sendChat);
router.get("/health", health);

export default router;
