const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  testCase: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase' },
  isHidden: { type: Boolean, default: true },
  passed: { type: Boolean, default: false },
  output: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  runtimeMs: { type: Number, default: 0 },
  error: { type: String, default: '' }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  status: { type: String, enum: ['running', 'success', 'failed'], default: 'running' },
  score: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  testResults: [testResultSchema],
  createdAt: { type: Date, default: Date.now }
});

submissionSchema.index({ problem: 1, student: 1, createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
