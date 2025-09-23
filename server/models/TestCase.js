const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  isHidden: { type: Boolean, default: true },
  input: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  pointWeight: { type: Number, default: 1 },
  timeoutMs: { type: Number, default: 5000 },
  createdAt: { type: Date, default: Date.now }
});

testCaseSchema.index({ problem: 1, isHidden: 1 });

module.exports = mongoose.model('TestCase', testCaseSchema);
