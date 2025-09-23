const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  records: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      default: 'present'
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    markedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  totalStudents: {
    type: Number,
    required: true
  },
  presentCount: {
    type: Number,
    default: 0
  },
  absentCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFrozen: {
    type: Boolean,
    default: false
  },
  frozenAt: {
    type: Date,
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

// Update updatedAt field before saving
attendanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index for efficient queries
attendanceSchema.index({ classroom: 1, date: 1 }, { unique: true });
attendanceSchema.index({ classroom: 1 });
attendanceSchema.index({ date: 1 });

// Virtual for attendance percentage
attendanceSchema.virtual('attendancePercentage').get(function() {
  if (this.totalStudents === 0) return 0;
  return Math.round((this.presentCount / this.totalStudents) * 100);
});

// Method to update attendance counts
attendanceSchema.methods.updateCounts = function() {
  this.presentCount = this.records.filter(record => record.status === 'present').length;
  this.absentCount = this.records.filter(record => record.status === 'absent').length;
  return this;
};

// Static method to get attendance for a date range
attendanceSchema.statics.getAttendanceForDateRange = function(classroomId, startDate, endDate) {
  return this.find({
    classroom: classroomId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('records.student', 'name email').populate('records.markedBy', 'name');
};

// Static method to get student attendance summary
attendanceSchema.statics.getStudentAttendanceSummary = function(classroomId, studentId, startDate, endDate) {
  const mongoose = require('mongoose');
  const classroomObjectId = mongoose.Types.ObjectId(classroomId);
  const studentObjectId = mongoose.Types.ObjectId(studentId);
  return this.aggregate([
    {
      $match: {
        classroom: classroomObjectId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $unwind: '$records'
    },
    {
      $match: {
        'records.student': studentObjectId
      }
    },
    {
      $group: {
        _id: null,
        totalClasses: { $sum: 1 },
        presentCount: {
          $sum: {
            $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0]
          }
        },
        absentCount: {
          $sum: {
            $cond: [{ $eq: ['$records.status', 'absent'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Attendance', attendanceSchema);
