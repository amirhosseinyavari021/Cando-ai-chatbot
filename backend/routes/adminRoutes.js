import express from 'express';
// FIX: Ensure this path and filename casing is EXACTLY correct.
import { addFaq, getFaqs } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/faq').post(protect, admin, addFaq).get(protect, admin, getFaqs);

export default router;