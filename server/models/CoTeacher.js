const mongoose = require('mongoose');

const coTeacherSchema = new mongoose.Schema({
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  mainTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  invitationToken: {
    type: String,
    required: true,
    unique: true
  },
  invitationEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired invitations
  },
  respondedAt: {
    type: Date,
    default: null
  },
  // Track who performed actions
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Additional metadata
  invitationMessage: {
    type: String,
    trim: true,
    maxlength: 500
  },
  declineReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt field before saving
coTeacherSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
coTeacherSchema.index({ classroom: 1 });
coTeacherSchema.index({ mainTeacher: 1 });
coTeacherSchema.index({ coTeacher: 1 });
coTeacherSchema.index({ status: 1 });
coTeacherSchema.index({ invitationToken: 1 });
coTeacherSchema.index({ invitationEmail: 1 });
coTeacherSchema.index({ expiresAt: 1 });

// Compound indexes for common queries
coTeacherSchema.index({ classroom: 1, status: 1 });
coTeacherSchema.index({ coTeacher: 1, status: 1 });

module.exports = mongoose.model('CoTeacher', coTeacherSchema);
