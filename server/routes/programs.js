const express = require('express');
const { auth } = require('../middleware/auth');
const { listBranches, listSections, getAvailableCourses } = require('../services/catalogService');

const router = express.Router();

// GET /api/programs/:program/branches
router.get('/:program/branches', auth, async (req, res) => {
  try {
    const { program } = req.params;
    const branches = listBranches(program);
    if (!branches) return res.status(404).json({ message: 'Program not found' });
    res.json({ program, branches });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/programs/:program/branches/:branch/sections
router.get('/:program/branches/:branch/sections', auth, async (req, res) => {
  try {
    const { program, branch } = req.params;
    const sections = listSections(program, branch);
    if (!sections) return res.status(404).json({ message: 'Program/Branch not found' });
    res.json({ program, branch, sections });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/programs/:program/branches/:branch/courses - Get available courses for a branch
router.get('/:program/branches/:branch/courses', auth, async (req, res) => {
  try {
    const { program, branch } = req.params;
    const { semester } = req.query;
    
    const courses = await getAvailableCourses(program, branch, semester);
    res.json({ 
      program, 
      branch, 
      semester: semester || 'Both',
      courses 
    });
  } catch (error) {
    console.error('Get available courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


