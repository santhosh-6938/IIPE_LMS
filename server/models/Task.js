const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: false
  },
  files: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number
  }],
  status: {
    type: String,
    enum: ['draft', 'submitted'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date
  },
  draftedAt: {
    type: Date
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String
  },
  remarks: {
    type: String
  },
  // Student-teacher interaction messages per submission
  interactionMessages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['student', 'teacher'], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    readByTeacher: { type: Boolean, default: false },
    readByStudent: { type: Boolean, default: false }
  }],
  gradedAt: {
    type: Date
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Auto-submission tracking fields
  isAutoSubmitted: {
    type: Boolean,
    default: false
  },
  autoSubmittedAt: {
    type: Date
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
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
  deadline: {
    type: Date
  },
  maxSubmissions: {
    type: Number,
    default: 1
  },
  instructions: {
    type: String
  },
  // Coding assignment linkage
  isCodingAssignment: {
    type: Boolean,
    default: false
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    default: null
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number
  }],
  submissions: [submissionSchema],
  // Group interaction messages for all students who have submitted, plus teacher
  groupInteractionMessages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['student', 'teacher'], required: true },
    message: { type: String, required: true },
    attachments: [{
      filename: String,
      originalName: String,
      path: String,
      mimetype: String,
      size: Number,
      uploadedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
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
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update updatedAt for submissions when they change
taskSchema.pre('save', function(next) {
  if (this.isModified('submissions') && Array.isArray(this.submissions)) {
    this.submissions.forEach((sub) => {
      if (sub) {
        sub.updatedAt = new Date();
      }
    });
  }
  next();
});

// Index for better query performance
taskSchema.index({ classroom: 1 });
taskSchema.index({ teacher: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ problem: 1 });

module.exports = mongoose.model('Task', taskSchema);