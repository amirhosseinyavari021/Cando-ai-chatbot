import express from 'express';
// FIX: Ensure this path and filename casing is EXACTLY correct.
// If your controller file is named ChatController.js, use that here.
import { processMessage } from '../controllers/chatController.js';

const router = express.Router();

router.route('/').post(processMessage);

export default router;