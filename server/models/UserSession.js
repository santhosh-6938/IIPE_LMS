const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  token: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  blockedUntil: {
    type: Date,
    default: null
  },
  concurrentLoginRequests: [{
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    requestedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending'
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 60 * 1000) // 2 minutes
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired sessions
  }
});

// Index for better query performance
userSessionSchema.index({ userId: 1, isActive: 1 });
userSessionSchema.index({ sessionId: 1 });
userSessionSchema.index({ expiresAt: 1 });

// Method to check if user is blocked
userSessionSchema.methods.isBlocked = function() {
  return this.blockedUntil && this.blockedUntil > new Date();
};

// Method to get blocking duration based on attempts
userSessionSchema.methods.getBlockingDuration = function() {
  const durations = [2, 5, 10, 60]; // minutes
  const index = Math.min(this.loginAttempts - 1, durations.length - 1);
  return durations[index] * 60 * 1000; // Convert to milliseconds
};

// Method to block user
userSessionSchema.methods.blockUser = function() {
  this.loginAttempts += 1;
  this.blockedUntil = new Date(Date.now() + this.getBlockingDuration());
  return this.save();
};

// Method to reset attempts
userSessionSchema.methods.resetAttempts = function() {
  this.loginAttempts = 0;
  this.blockedUntil = null;
  return this.save();
};

module.exports = mongoose.model('UserSession', userSessionSchema);
