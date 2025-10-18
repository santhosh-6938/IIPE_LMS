const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{4}$/.test(v);
      },
      message: 'Course code must be exactly 4 digits'
    }
  },
  subject: {
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
  semester: {
    type: String,
    enum: ['Autumn', 'Spring', 'Both'],
    required: true,
    default: 'Both'
  },
  credits: {
    type: Number,
    min: 1,
    max: 10,
    default: 3
  },
  description: {
    type: String,
    trim: true
  },
  // Flag to indicate if course is available for next semester
  isAvailableForNextSemester: {
    type: Boolean,
    default: true
  },
  // Flag to indicate if course is currently active
  isActive: {
    type: Boolean,
    default: true
  },
  // Metadata for flag management
  flagHistory: [{
    action: {
      type: String,
      enum: ['flagged', 'unflagged'],
      required: true
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      trim: true
    }
  }],
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
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
courseSchema.index({ courseCode: 1 });
courseSchema.index({ program: 1, branch: 1 });
courseSchema.index({ isAvailableForNextSemester: 1, isActive: 1 });

module.exports = mongoose.model('Course', courseSchema);
