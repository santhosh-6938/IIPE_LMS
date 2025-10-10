const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  rollNumber: {
    type: String,
    required: function() {
      return this.role === 'student';
    },
    unique: true,
    sparse: true, // Allows null values for non-students
    trim: true,
    uppercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // Store previous password hashes for reuse checks (most recent last)
  passwordHistory: {
    type: [String],
    default: []
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: null
  },
  // Profile fields for students
  phone: {
    type: String,
    default: null,
    trim: true
  },
  profilePhoto: {
    type: String,
    default: null
  },
  course: {
    type: String,
    default: null,
    trim: true
  },
  year: {
    type: String,
    default: null,
    trim: true
  },
  semester: {
    type: String,
    default: null,
    trim: true
  },
  department: {
    type: String,
    default: null,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  address: {
    city: {
      type: String,
      default: null,
      trim: true
    },
    state: {
      type: String,
      default: null,
      trim: true
    }
  },
  bio: {
    type: String,
    default: null,
    trim: true,
    maxlength: 500
  },
  // First login tracking
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  // Active status
  isActive: {
    type: Boolean,
    default: true
  },
  // Account blocking status
  isBlocked: {
    type: Boolean,
    default: false
  },
  // Blocking details
  blockedAt: {
    type: Date,
    default: null
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  blockedReason: {
    type: String,
    default: null,
    trim: true
  },
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordOTP: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  passwordChangeHistory: [
    {
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ],
  passwordChangeCount: {
    type: Number,
    default: 0
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
userSchema.index({ rollNumber: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1 });
userSchema.index({ isActive: 1, isBlocked: 1 });

module.exports = mongoose.model('User', userSchema);