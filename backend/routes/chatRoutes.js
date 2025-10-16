import express from 'express';
// Make sure the controller path is also correct
import { processMessage } from '../controllers/chatController.js';

const router = express.Router();

router.route('/').post(processMessage);

export default router;