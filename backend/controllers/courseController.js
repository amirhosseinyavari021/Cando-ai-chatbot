import asyncHandler from 'express-async-handler';
import Course from '../models/Course.js';

/**
 * @desc    Get courses with optional filters
 * @route   GET /api/courses
 * @access  Public
 */
const getCourses = asyncHandler(async (req, res) => {
  const { instructor, mode, q, status } = req.query;
  const filter = {};

  // 1. Text search
  if (q) {
    filter.$text = { $search: q };
  }

  // 2. Instructor name (using regex for partial match)
  if (instructor) {
    // We search instructor_name, not ID, as per the query param
    filter.instructor_name = { $regex: instructor, $options: 'i' };
  }

  // 3. Mode
  if (mode) {
    filter.mode = mode;
  }

  // 4. Registration Status
  if (status) {
    filter.registration_status = status;
  }

  const courses = await Course.find(filter).limit(50); // Add a limit
  res.json(courses);
});

export { getCourses };