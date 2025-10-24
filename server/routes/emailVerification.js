const express = require('express');
const {
  sendEmailVerificationOTP,
  verifyEmailOTP,
  isEmailVerified
} = require('../services/emailVerificationService');

const router = express.Router();

// Send email verification OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose = 'signup' } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    if (!['signup', 'login'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purpose. Must be signup or login'
      });
    }

    const result = await sendEmailVerificationOTP(email, purpose);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        expiresIn: result.expiresIn
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Send email verification OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify email OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose = 'signup' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    if (!['signup', 'login'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purpose. Must be signup or login'
      });
    }

    const result = await verifyEmailOTP(email, otp, purpose);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        code: result.code,
        remainingAttempts: result.remainingAttempts
      });
    }
  } catch (error) {
    console.error('Verify email OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Check if email is verified
router.get('/check-verification', async (req, res) => {
  try {
    const { email, purpose = 'signup' } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const verified = await isEmailVerified(email, purpose);
    
    res.json({
      success: true,
      isVerified: verified
    });
  } catch (error) {
    console.error('Check email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
