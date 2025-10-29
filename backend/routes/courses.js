import express from 'express';
import { getCourses } from '../controllers/courseController.js';

const router = express.Router();

// @route   GET /api/courses
// @desc    Get filtered list of courses
// @access  Public
router.route('/').get(getCourses);

export default router;