const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getSubjectByCourseCode,
  getCourses,
  createCourse,
  updateCourseAvailability,
  getCourseFlagHistory,
  bulkUpdateCourseAvailability
} = require('../controllers/courseController');

const router = express.Router();

// GET /api/courses/subject/:courseCode (authenticated)
router.get('/subject/:courseCode', auth, getSubjectByCourseCode);

// GET /api/courses/public/subject/:courseCode (unauthenticated fallback)
router.get('/public/subject/:courseCode', getSubjectByCourseCode);

// GET /api/courses - Get all courses with filtering
router.get('/', auth, getCourses);

// POST /api/courses - Create a new course (admin only)
router.post('/', auth, authorize('admin'), createCourse);

// PUT /api/courses/:courseCode/availability - Update course availability flag (admin only)
router.put('/:courseCode/availability', auth, authorize('admin'), updateCourseAvailability);

// GET /api/courses/:courseCode/flag-history - Get course flag history (admin only)
router.get('/:courseCode/flag-history', auth, authorize('admin'), getCourseFlagHistory);

// PUT /api/courses/bulk-availability - Bulk update course availability (admin only)
router.put('/bulk-availability', auth, authorize('admin'), bulkUpdateCourseAvailability);

module.exports = router;


