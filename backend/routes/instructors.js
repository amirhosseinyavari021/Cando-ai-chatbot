import express from 'express';
import { getInstructors } from '../controllers/instructorController.js';

const router = express.Router();

// @route   GET /api/instructors
// @desc    Get filtered list of instructors
// @access  Public
router.route('/').get(getInstructors);

export default router;