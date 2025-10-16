import asyncHandler from 'express-async-handler';
import Faq from '../models/Faq.js';

/**
 * @desc    Add a new FAQ entry
 * @route   POST /api/admin/faq
 * @access  Private/Admin
 */
const addFaq = asyncHandler(async (req, res) => {
  const { question, answer, language, keywords } = req.body;

  if (!question || !answer) {
    res.status(400);
    throw new Error('Question and Answer fields are required.');
  }

  const faq = new Faq({
    question,
    answer,
    language,
    keywords: keywords || [],
    createdBy: req.user._id, // Assumes 'protect' middleware has run
  });

  const createdFaq = await faq.save();
  res.status(201).json(createdFaq);
});

/**
 * @desc    Get all FAQs
 * @route   GET /api/admin/faq
 * @access  Private/Admin
 */
const getFaqs = asyncHandler(async (req, res) => {
  const faqs = await Faq.find({}).populate('createdBy', 'name');
  res.json(faqs);
});

export { addFaq, getFaqs };