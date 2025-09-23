const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  submissionId: {
    type: mongoose.Schema.Types.ObjectId
  },
  fileType: {
    type: String,
    enum: ['task_attachment', 'submission_file'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
fileSchema.index({ taskId: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ fileType: 1 });

module.exports = mongoose.model('File', fileSchema);
