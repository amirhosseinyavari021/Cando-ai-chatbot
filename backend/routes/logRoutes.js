import express from 'express';
// Make sure these paths are correct
import { getLogs } from '../controllers/logController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, admin, getLogs);

export default router;