const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Roadmap = require('../models/Roadmap');

/**
 * @desc    Get all available roadmaps (list view)
 * @route   GET /api/roadmap
 * @access  Public
 */
const getAllRoadmaps = asyncHandler(async (req, res) => {
  const roadmaps = await Roadmap.find().select(
    'role_slug role_title summary language'
  );
  res.json(roadmaps);
});

/**
 * @desc    Get a single, detailed roadmap by slug
 * @route   GET /api/roadmap/:role_slug
 * @access  Public
 */
const getRoadmapBySlug = asyncHandler(async (req, res) => {
  const { role_slug } = req.params;
  
  // Find by slug, case-insensitive
  const roadmap = await Roadmap.findOne({ 
    role_slug: { $regex: new RegExp(`^${role_slug}$`, 'i') } 
  });

  if (roadmap) {
    res.json(roadmap);
  } else {
    res.status(404);
    throw new Error('Roadmap not found');
  }
});

// Define routes
router.route('/').get(getAllRoadmaps);
router.route('/:role_slug').get(getRoadmapBySlug);

module.exports = router;