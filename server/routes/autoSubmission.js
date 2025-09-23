const express = require('express');
const {
  getAutoSubmissionStats,
  triggerAutoSubmission,
  triggerAutoSubmissionForTask,
  getPendingAutoSubmissions,
  getAutoSubmissionHistory
} = require('../controllers/autoSubmissionController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @route   GET /api/auto-submission/stats
 * @desc    Get auto-submission statistics
 * @access  Admin only
 */
router.get('/stats', authorize('admin'), getAutoSubmissionStats);

/**
 * @route   POST /api/auto-submission/trigger
 * @desc    Manually trigger auto-submission for all tasks with passed deadlines
 * @access  Admin only
 */
router.post('/trigger', authorize('admin'), triggerAutoSubmission);

/**
 * @route   POST /api/auto-submission/trigger/:taskId
 * @desc    Manually trigger auto-submission for a specific task
 * @access  Admin only
 */
router.post('/trigger/:taskId', authorize('admin'), triggerAutoSubmissionForTask);

/**
 * @route   GET /api/auto-submission/pending
 * @desc    Get tasks with pending auto-submissions (draft submissions past deadline)
 * @access  Admin only
 */
router.get('/pending', authorize('admin'), getPendingAutoSubmissions);

/**
 * @route   GET /api/auto-submission/history/:taskId
 * @desc    Get auto-submission history for a specific task
 * @access  Admin or Teacher (for their own tasks)
 */
router.get('/history/:taskId', (req, res, next) => {
  // Allow both admin and teacher access
  if (req.user.role === 'admin' || req.user.role === 'teacher') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Teacher role required.'
    });
  }
}, getAutoSubmissionHistory);

module.exports = router;
