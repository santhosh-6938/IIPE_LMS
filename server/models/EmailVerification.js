const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  hashedOtp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['signup', 'login'],
    required: true
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired documents
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: {
    type: Date,
    default: null
  }
});

// Index for better query performance
emailVerificationSchema.index({ email: 1, purpose: 1 });
emailVerificationSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
