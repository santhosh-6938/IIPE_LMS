const express = require('express');
const { auth } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  changePasswordFirstLogin,
  resetPassword
} = require('../controllers/authController');

const router = express.Router();

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get current user
router.get('/me', auth, getMe);

// Change password on first login
router.post('/change-password-first-login', auth, changePasswordFirstLogin);

// Reset password
router.post('/reset', resetPassword);

module.exports = router;