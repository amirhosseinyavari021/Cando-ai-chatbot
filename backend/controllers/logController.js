import asyncHandler from 'express-async-handler';
import Log from '../models/Log.js';

/**
 * @desc    Get all interaction logs
 * @route   GET /api/logs
 * @access  Private/Admin
 */
const getLogs = asyncHandler(async (req, res) => {
  // In a real app, add pagination here
  const logs = await Log.find({}).sort({ timestamp: -1 }).limit(100);
  res.json(logs);
});

export { getLogs };