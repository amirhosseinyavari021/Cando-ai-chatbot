// backend/routes/chatRouter.js
import { Router } from "express";
import { handleChat } from "../controllers/aiController.js";

const router = Router();
router.post("/stream", handleChat);

export default router;
