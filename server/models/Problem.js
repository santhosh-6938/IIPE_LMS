const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  statement: { type: String, required: true },
  constraints: { type: String, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  allowedLanguages: [{ type: String, trim: true }],
  samples: [
    {
      input: { type: String, default: '' },
      expectedOutput: { type: String, default: '' },
      explanation: { type: String, default: '' }
    }
  ],
  defaultTemplates: {
    type: Map,
    of: String,
    default: {}
  },
  hiddenTestCount: { type: Number, default: 0 },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

problemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

problemSchema.index({ slug: 1 });
problemSchema.index({ classroom: 1 });

module.exports = mongoose.model('Problem', problemSchema);
