const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    enum: ['Autumn', 'Spring'],
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  program: {
    type: String,
    enum: ['B.Tech', 'M.Tech', 'M.Sc'],
    required: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String,
    trim: true,
    default: null
  },
  // Month timeline for semester (1-12)
  startMonth: {
    type: Number,
    min: 1,
    max: 12,
    default: null
  },
  endMonth: {
    type: Number,
    min: 1,
    max: 12,
    default: null
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // joinToken field has been removed
  isActive: {
    type: Boolean,
    default: true
  },
  // Archiving fields
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  archivedReason: {
    type: String,
    trim: true,
    default: null
  },
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
classroomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
classroomSchema.index({ teacher: 1 });
classroomSchema.index({ students: 1 });
classroomSchema.index({ program: 1, branch: 1, academicYear: 1 });

module.exports = mongoose.model('Classroom', classroomSchema);