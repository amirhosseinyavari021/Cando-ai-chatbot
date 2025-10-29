import asyncHandler from 'express-async-handler';
import Instructor from '../models/Instructor.js';

/**
 * @desc    Get instructors with optional name filter
 * @route   GET /api/instructors
 * @access  Public
 */
const getInstructors = asyncHandler(async (req, res) => {
  const { name } = req.query;
  const filter = {};

  if (name) {
    // Use regex for partial name match (more flexible than $text)
    filter.name = { $regex: name, $options: 'i' };
  }

  const instructors = await Instructor.find(filter).limit(50);
  res.json(instructors);
});

export { getInstructors };