const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
  action: { type: String, required: true },
  resourceType: { type: String, default: '' },
  resourceId: { type: String, default: '' },
  metadata: { type: Object, default: {} },
  // Enhanced tracking for co-teacher functionality
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
  teacherRole: { 
    type: String, 
    enum: ['main_teacher', 'co_teacher'], 
    default: null 
  },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ classroomId: 1, createdAt: -1 });
activityLogSchema.index({ teacherRole: 1 });
activityLogSchema.index({ classroomId: 1, teacherRole: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
