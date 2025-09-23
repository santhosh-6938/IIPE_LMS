const express = require('express');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Static mapping for now; could be moved to DB later
const PROGRAM_BRANCHES = {
  'B.Tech': ['CSE', 'ECE', 'IT', 'Mechanical'],
  'M.Tech': ['AI', 'Data Science', 'VLSI'],
  'M.Sc': ['Physics', 'Chemistry', 'Mathematics']
};

// Get branches by program
router.get('/:program/branches', auth, authorize('teacher'), async (req, res) => {
  try {
    const { program } = req.params;
    const branches = PROGRAM_BRANCHES[program];
    if (!branches) {
      return res.status(404).json({ message: 'Program not found' });
    }
    return res.json({ program, branches });
  } catch (error) {
    console.error('Fetch branches error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


