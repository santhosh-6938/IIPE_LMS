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