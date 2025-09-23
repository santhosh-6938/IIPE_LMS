const express = require('express');
const { auth } = require('../middleware/auth');
const {
  createTeacher,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  getClassrooms,
  getTasks,
  getStatistics,
  getTeacherActivity,
  getEmailConfig
} = require('../controllers/adminController');

const router = express.Router();

// Create teacher
router.post('/users/teacher', auth, createTeacher);

// Get all users
router.get('/users', auth, getAllUsers);

// Get user by ID
router.get('/users/:id', auth, getUserById);

// Update user
router.put('/users/:id', auth, updateUser);

// Delete user
router.delete('/users/:id', auth, deleteUser);

// Get dashboard stats
router.get('/dashboard/stats', auth, getDashboardStats);

// Get statistics (alias for dashboard stats)
router.get('/statistics', auth, getStatistics);

// Get classrooms
router.get('/classrooms', auth, getClassrooms);

// Get tasks
router.get('/tasks', auth, getTasks);

// Get teacher activity
router.get('/teacher-activity', auth, getTeacherActivity);

// Email configuration status
router.get('/email-config', auth, getEmailConfig);

module.exports = router;
