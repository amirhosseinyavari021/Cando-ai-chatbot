import express from 'express';
// Make sure these paths are correct
import { addFaq, getFaqs } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/faq').post(protect, admin, addFaq).get(protect, admin, getFaqs);

export default router;