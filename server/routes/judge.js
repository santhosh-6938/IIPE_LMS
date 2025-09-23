const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  createProblem,
  addTestCases,
  getProblem,
  runSamples,
  submitSolution,
  listMySubmissions
} = require('../controllers/judgeController');

const router = express.Router();

// Teacher/Admin
router.post('/problems', auth, authorize('teacher', 'admin'), createProblem);
router.post('/problems/:id/testcases', auth, authorize('teacher', 'admin'), addTestCases);

// Public (auth for role-based visibility later)
router.get('/problems/:id', auth, getProblem);

// Student actions
router.post('/problems/:id/run', auth, authorize('student'), runSamples);
router.post('/problems/:id/submit', auth, authorize('student'), submitSolution);
router.get('/submissions/mine', auth, authorize('student'), listMySubmissions);

module.exports = router;
