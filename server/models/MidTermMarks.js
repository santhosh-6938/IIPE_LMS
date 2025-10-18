const mongoose = require('mongoose');

const midTermMarksSchema = new mongoose.Schema({
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
  term: {
    type: String,
    enum: ['Mid Term I', 'Mid Term II'],
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    enum: ['Autumn', 'Spring'],
    required: true
  },
  subject: {
    type: String,
    trim: true,
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
    marks: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
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
midTermMarksSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
midTermMarksSchema.index({ classroom: 1, term: 1, academicYear: 1, semester: 1 });
midTermMarksSchema.index({ teacher: 1, term: 1 });
midTermMarksSchema.index({ status: 1 });
midTermMarksSchema.index({ 'marks.student': 1 });

module.exports = mongoose.model('MidTermMarks', midTermMarksSchema);
