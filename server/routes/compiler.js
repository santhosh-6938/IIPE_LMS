const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getLanguages,
  getStatus,
  runCode,
  runAndSave,
  downloadCode,
  getTemplates,
  healthCheck,
  getHistory,
  getAllStudentCode,
  getCodeById,
  downloadCodeById
} = require('../controllers/compilerController');

const router = express.Router();

// Get supported languages
router.get('/languages', getLanguages);

// Get compiler status
router.get('/status', getStatus);

// Run code (no save)
router.post('/run', runCode);

// Compile, run and SAVE code (students only)
router.post('/run-and-save', auth, runAndSave);

// Download code as file
router.post('/download', downloadCode);

// Get code templates
router.get('/templates/:language', getTemplates);

// Health check
router.get('/health', healthCheck);

// List authenticated user's compiled code history (students only)
router.get('/history', auth, getHistory);

// List all student code (teachers and admins only)
router.get('/all-student-code', auth, getAllStudentCode);

// Get a specific code entry (owner only, or teachers/admins for any student code)
router.get('/code/:id', auth, getCodeById);

// Download saved code by id (owner only, or teachers/admins for any student code)
router.get('/download/:id', auth, downloadCodeById);

module.exports = router;
