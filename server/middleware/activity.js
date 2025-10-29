const ActivityLog = require('../models/ActivityLog');
const Classroom = require('../models/Classroom');

async function logActivity(req, action, resourceType = '', resourceId = '', metadata = {}) {
  try {
    if (!req.user) return;
    
    // Determine teacher role for classroom-related actions
    let teacherRole = null;
    let classroomId = null;
    
    if (req.user.role === 'teacher' && resourceType === 'classroom') {
      classroomId = resourceId;
      
      // Check if user is main teacher or co-teacher
      try {
        const classroom = await Classroom.findById(resourceId);
        if (classroom) {
          if (classroom.teacher.toString() === req.user._id.toString()) {
            teacherRole = 'main_teacher';
          } else if (classroom.coTeacherEnabled && 
                     classroom.coTeacher && 
                     classroom.coTeacher.toString() === req.user._id.toString()) {
            teacherRole = 'co_teacher';
          }
        }
      } catch (error) {
        console.warn('Failed to determine teacher role:', error.message);
      }
    }
    
    await ActivityLog.create({
      user: req.user._id,
      role: req.user.role,
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : '',
      metadata,
      classroomId: classroomId || null,
      teacherRole,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || ''
    });
  } catch (e) {
    console.warn('Activity log failed:', e.message);
  }
}

// Enhanced logging function for co-teacher specific actions
async function logCoTeacherActivity(req, action, classroomId, metadata = {}) {
  try {
    if (!req.user) return;
    
    let teacherRole = null;
    
    // Determine teacher role
    try {
      const classroom = await Classroom.findById(classroomId);
      if (classroom) {
        if (classroom.teacher.toString() === req.user._id.toString()) {
          teacherRole = 'main_teacher';
        } else if (classroom.coTeacherEnabled && 
                   classroom.coTeacher && 
                   classroom.coTeacher.toString() === req.user._id.toString()) {
          teacherRole = 'co_teacher';
        }
      }
    } catch (error) {
      console.warn('Failed to determine teacher role:', error.message);
    }
    
    await ActivityLog.create({
      user: req.user._id,
      role: req.user.role,
      action,
      resourceType: 'co_teacher',
      resourceId: String(classroomId),
      metadata,
      classroomId,
      teacherRole,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || ''
    });
  } catch (e) {
    console.warn('Co-teacher activity log failed:', e.message);
  }
}

module.exports = { logActivity, logCoTeacherActivity };
