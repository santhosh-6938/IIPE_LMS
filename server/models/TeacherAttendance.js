const mongoose = require('mongoose');

const teacherAttendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  records: [{
    teacher: {
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
  totalTeachers: {
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
teacherAttendanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index for efficient queries
teacherAttendanceSchema.index({ date: 1 }, { unique: true });
teacherAttendanceSchema.index({ date: 1 });

// Virtual for attendance percentage
teacherAttendanceSchema.virtual('attendancePercentage').get(function() {
  if (this.totalTeachers === 0) return 0;
  return Math.round((this.presentCount / this.totalTeachers) * 100);
});

// Method to update attendance counts
teacherAttendanceSchema.methods.updateCounts = function() {
  this.presentCount = this.records.filter(record => record.status === 'present').length;
  this.absentCount = this.records.filter(record => record.status === 'absent').length;
  return this;
};

// Static method to get attendance for a date range
teacherAttendanceSchema.statics.getAttendanceForDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('records.teacher', 'name email').populate('records.markedBy', 'name');
};

// Static method to get teacher attendance summary
teacherAttendanceSchema.statics.getTeacherAttendanceSummary = function(teacherId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $unwind: '$records'
    },
    {
      $match: {
        'records.teacher': mongoose.Types.ObjectId(teacherId)
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
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

module.exports = mongoose.model('TeacherAttendance', teacherAttendanceSchema);
