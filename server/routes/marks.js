const express = require('express');
const multer = require('multer');
const { auth, authorize } = require('../middleware/auth');
const {
  getMidTermMarks,
  createMidTermMarks,
  uploadMidTermMarks,
  updateMidTermMarks,
  publishMidTermMarks,
  getStudentMidTermMarks,
  getTaskMarks,
  updateTaskMarks,
  publishTaskMarks,
  getStudentTaskMarks
} = require('../controllers/marksController');

const router = express.Router();

// Configure multer for Excel file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) and CSV files are allowed.'));
    }
  }
});

// Mid Term Marks Routes

// Get mid term marks (teachers only)
router.get('/midterm', auth, authorize('teacher'), getMidTermMarks);

// Create mid term marks (teachers only)
router.post('/midterm', auth, authorize('teacher'), createMidTermMarks);

// Upload mid term marks from Excel (teachers only)
router.post('/midterm/upload', auth, authorize('teacher'), upload.single('excelFile'), uploadMidTermMarks);

// Update mid term marks (teachers only, draft only)
router.put('/midterm/:marksId', auth, authorize('teacher'), updateMidTermMarks);

// Publish mid term marks (teachers only)
router.post('/midterm/:marksId/publish', auth, authorize('teacher'), publishMidTermMarks);

// Get student's mid term marks (students only)
router.get('/midterm/student', auth, authorize('student'), getStudentMidTermMarks);

// Task Marks Routes

// Get task marks (teachers only)
router.get('/task/:taskId', auth, authorize('teacher'), getTaskMarks);

// Update task marks (teachers only)
router.put('/task/:taskId', auth, authorize('teacher'), updateTaskMarks);

// Publish task marks (teachers only)
router.post('/task/:taskId/publish', auth, authorize('teacher'), publishTaskMarks);

// Get student's task marks (students only)
router.get('/task/:taskId/student', auth, authorize('student'), getStudentTaskMarks);

module.exports = router;
