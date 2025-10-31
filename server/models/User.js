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
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // allow null/undefined for non-teachers
        return /^[A-Za-z0-9_-]+$/.test(v);
      },
      message: 'Employee ID must be alphanumeric and may include - or _'
    }
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
  },
  // Teacher profile fields
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: null
  },
  alternateEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  nationality: {
    type: String,
    trim: true,
    default: null
  },
  languagesKnown: {
    type: [String],
    default: []
  },
  currentAddress: {
    line1: { type: String, default: null, trim: true },
    line2: { type: String, default: null, trim: true },
    city: { type: String, default: null, trim: true },
    state: { type: String, default: null, trim: true },
    postalCode: { type: String, default: null, trim: true },
    country: { type: String, default: null, trim: true }
  },
  permanentAddress: {
    line1: { type: String, default: null, trim: true },
    line2: { type: String, default: null, trim: true },
    city: { type: String, default: null, trim: true },
    state: { type: String, default: null, trim: true },
    postalCode: { type: String, default: null, trim: true },
    country: { type: String, default: null, trim: true }
  },
  designation: { type: String, default: null, trim: true },
  programsTaught: { type: [String], default: [] },
  coursesAssigned: { type: [String], default: [] },
  specialization: { type: String, default: null, trim: true },
  experienceYears: { type: Number, default: null, min: 0, max: 60 },
  dateOfJoining: { type: Date, default: null },
  employmentType: { type: String, enum: ['Full-time','Part-time','Research Scholar', null], default: null },
  highestQualification: { type: String, default: null, trim: true },
  degreesCertifications: { type: [String], default: [] },
  institutionsAttended: { type: [String], default: [] },
  yearOfGraduation: { type: Number, default: null },
  researchInterests: { type: [String], default: [] },
  publications: { type: [String], default: [] },
  workshops: { type: [String], default: [] },
  awards: { type: [String], default: [] },
  createdBy: { type: String, default: null },
  updatedBy: { type: String, default: null },
  remarks: { type: String, default: null, trim: true },
  verificationStatus: { type: String, enum: ['pending','verified','rejected', null], default: 'pending' },
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