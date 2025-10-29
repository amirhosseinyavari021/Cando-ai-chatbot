import asyncHandler from 'express-async-handler';
import Faq from '../models/Faq.js';

/**
 * @desc    Get FAQs with optional query
 * @route   GET /api/faq
 * @access  Public
 */
const getFaqs = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const filter = {};

  if (q) {
    filter.$text = { $search: q };
  }

  // Add projection to include text score if searching
  const projection = q ? { score: { $meta: 'textScore' } } : {};
  const sort = q ? { score: { $meta: 'textScore' } } : { _id: -1 };

  const faqs = await Faq.find(filter, projection).sort(sort).limit(50);
  res.json(faqs);
});

export { getFaqs };