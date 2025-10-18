const mongoose = require('mongoose');

const taskMarksSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  marks: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    feedback: {
      type: String,
      trim: true,
      default: ''
    },
    gradedAt: {
      type: Date,
      default: Date.now
    }
  }],
  publishedAt: {
    type: Date,
    default: null
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Update updatedAt field before saving
taskMarksSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
taskMarksSchema.index({ task: 1 });
taskMarksSchema.index({ classroom: 1 });
taskMarksSchema.index({ teacher: 1 });
taskMarksSchema.index({ status: 1 });
taskMarksSchema.index({ 'marks.student': 1 });

module.exports = mongoose.model('TaskMarks', taskMarksSchema);
