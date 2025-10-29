import express from 'express';
import { getFaqs } from '../controllers/faqController.js';

const router = express.Router();

// @route   GET /api/faq
// @desc    Search FAQs
// @access  Public
router.route('/').get(getFaqs);

export default router;