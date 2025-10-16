import express from 'express';
// FIX: Ensure this path and filename casing is EXACTLY correct.
import { getLogs } from '../controllers/logController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, admin, getLogs);

export default router;