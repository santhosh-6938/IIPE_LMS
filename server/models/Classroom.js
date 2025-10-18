const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  courseId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Format: <course_code>_<sem_indicator>_<branch>_<section>_<academic_year>
        // Example: 1011_0_chemical_engineering_a_2425
        return /^[0-9]{4}_[01]_[a-zA-Z0-9_()-]+_[a-zA-Z0-9]+_[0-9]{4}$/.test(v);
      },
      message: 'Course ID must follow format: <course_code>_<sem_indicator>_<branch>_<section>_<academic_year>'
    }
  },
  courseCode: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{4}$/.test(v);
      },
      message: 'Course code must be exactly 4 digits'
    }
  },
  section: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9]+$/.test(v) && v.length >= 1;
      },
      message: 'Section must contain only alphanumeric characters'
    }
  },
  semester: {
    type: String,
    enum: ['Autumn', 'Spring'],
    required: true
  },
  academicYear: {
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
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String,
    trim: true,
    default: null
  },
  // Month timeline for semester (1-12)
  startMonth: {
    type: Number,
    min: 1,
    max: 12,
    default: null
  },
  endMonth: {
    type: Number,
    min: 1,
    max: 12,
    default: null
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // joinToken field has been removed
  isActive: {
    type: Boolean,
    default: true
  },
  // Archiving fields
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  archivedReason: {
    type: String,
    trim: true,
    default: null
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

// Generate courseId before validation so 'required' passes
classroomSchema.pre('validate', function(next) {
  const shouldGenerate = (
    !this.courseId ||
    this.isModified('courseCode') ||
    this.isModified('semester') ||
    this.isModified('branch') ||
    this.isModified('section') ||
    this.isModified('academicYear')
  );
  if (shouldGenerate && this.courseCode && this.semester && this.branch && this.section && this.academicYear) {
    // Generate courseId: <course_code>_<sem_indicator>_<branch>_<section>_<academic_year>
    const semIndicator = this.semester === 'Autumn' ? '0' : '1';
    const academicYearShort = this.academicYear.split('-').map(year => year.slice(-2)).join('');
    // Replace spaces with underscores in branch name
    const branchFormatted = this.branch.toLowerCase().replace(/\s+/g, '_');
    this.courseId = `${this.courseCode}_${semIndicator}_${branchFormatted}_${this.section.toLowerCase()}_${academicYearShort}`;
  }
  next();
});

// Update updatedAt field before saving
classroomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
classroomSchema.index({ teacher: 1 });
classroomSchema.index({ students: 1 });
classroomSchema.index({ program: 1, branch: 1, academicYear: 1 });
classroomSchema.index({ courseId: 1 }); // Index for courseId uniqueness and queries

module.exports = mongoose.model('Classroom', classroomSchema);