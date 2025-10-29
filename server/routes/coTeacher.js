const express = require('express');
const CoTeacher = require('../models/CoTeacher');
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { logCoTeacherActivity } = require('../middleware/activity');
const coTeacherService = require('../services/coTeacherService');

const router = express.Router();

// Invite co-teacher to classroom (main teacher only)
router.post('/invite', auth, authorize('teacher'), async (req, res) => {
  try {
    const { classroomId, coTeacherEmail, invitationMessage } = req.body;

    if (!classroomId || !coTeacherEmail) {
      return res.status(400).json({ 
        message: 'Classroom ID and co-teacher email are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(coTeacherEmail)) {
      return res.status(400).json({ 
        message: 'Invalid email format' 
      });
    }

    const result = await coTeacherService.inviteCoTeacher(
      classroomId,
      req.user._id,
      coTeacherEmail,
      invitationMessage || ''
    );

    if (!result.success) {
      return res.status(400).json({ 
        message: result.message,
        code: result.code 
      });
    }

    // Log activity
    await logCoTeacherActivity(req, 'co_teacher.invite', classroomId, {
      coTeacherEmail,
      invitationMessage: invitationMessage || ''
    });

    res.json({
      message: result.message,
      invitation: result.invitation
    });

  } catch (error) {
    console.error('Invite co-teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept co-teacher invitation
router.post('/accept/:token', auth, authorize('teacher'), async (req, res) => {
  try {
    const { token } = req.params;

    const result = await coTeacherService.acceptCoTeacherInvitation(token);

    if (!result.success) {
      return res.status(400).json({ 
        message: result.message,
        code: result.code 
      });
    }

    // Log activity
    await logCoTeacherActivity(req, 'co_teacher.accept', result.classroom.id, {
      invitationToken: token
    });

    res.json({
      message: result.message,
      classroom: result.classroom
    });

  } catch (error) {
    console.error('Accept co-teacher invitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Decline co-teacher invitation
router.post('/decline/:token', auth, authorize('teacher'), async (req, res) => {
  try {
    const { token } = req.params;
    const { declineReason } = req.body;

    const result = await coTeacherService.declineCoTeacherInvitation(token, declineReason);

    if (!result.success) {
      return res.status(400).json({ 
        message: result.message,
        code: result.code 
      });
    }

    res.json({
      message: result.message
    });

  } catch (error) {
    console.error('Decline co-teacher invitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove co-teacher from classroom (main teacher only)
router.delete('/remove/:classroomId', auth, authorize('teacher'), async (req, res) => {
  try {
    const { classroomId } = req.params;

    const result = await coTeacherService.removeCoTeacher(classroomId, req.user._id);

    if (!result.success) {
      return res.status(400).json({ 
        message: result.message,
        code: result.code 
      });
    }

    // Log activity
    await logCoTeacherActivity(req, 'co_teacher.remove', classroomId);

    res.json({
      message: result.message
    });

  } catch (error) {
    console.error('Remove co-teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get co-teacher invitations for a classroom (main teacher only)
router.get('/invitations/:classroomId', auth, authorize('teacher'), async (req, res) => {
  try {
    const { classroomId } = req.params;

    const result = await coTeacherService.getCoTeacherInvitations(classroomId, req.user._id);

    if (!result.success) {
      return res.status(400).json({ 
        message: result.message,
        code: result.code 
      });
    }

    res.json({
      invitations: result.invitations
    });

  } catch (error) {
    console.error('Get co-teacher invitations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get classrooms where user is co-teacher
router.get('/classrooms', auth, authorize('teacher'), async (req, res) => {
  try {
    const result = await coTeacherService.getCoTeacherClassrooms(req.user._id);

    if (!result.success) {
      return res.status(400).json({ 
        message: result.message,
        code: result.code 
      });
    }

    res.json({
      classrooms: result.classrooms
    });

  } catch (error) {
    console.error('Get co-teacher classrooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get invitation details by token (for invitation page)
router.get('/invitation/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await CoTeacher.findOne({
      invitationToken: token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })
      .populate('classroom', 'name description subject')
      .populate('mainTeacher', 'name email')
      .populate('coTeacher', 'name email');

    if (!invitation) {
      return res.status(404).json({ 
        message: 'Invalid or expired invitation',
        code: 'INVALID_OR_EXPIRED'
      });
    }

    res.json({
      invitation: {
        id: invitation._id,
        classroom: invitation.classroom,
        mainTeacher: invitation.mainTeacher,
        coTeacher: invitation.coTeacher,
        invitationMessage: invitation.invitationMessage,
        invitedAt: invitation.invitedAt,
        expiresAt: invitation.expiresAt
      }
    });

  } catch (error) {
    console.error('Get invitation details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if user has access to classroom (main teacher or co-teacher)
router.get('/access/:classroomId', auth, authorize('teacher'), async (req, res) => {
  try {
    const { classroomId } = req.params;

    const result = await coTeacherService.hasClassroomAccess(classroomId, req.user._id);

    res.json({
      hasAccess: result.hasAccess,
      role: result.role
    });

  } catch (error) {
    console.error('Check classroom access error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activity logs for a classroom (showing both main teacher and co-teacher actions)
router.get('/activity/:classroomId', auth, authorize('teacher'), async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { page = 1, limit = 50, teacherRole } = req.query; // teacherRole can be 'main_teacher', 'co_teacher', or omitted for all

    // Check if user has access to this classroom
    const accessResult = await coTeacherService.hasClassroomAccess(classroomId, req.user._id);
    
    if (!accessResult.hasAccess) {
      return res.status(403).json({ 
        message: 'Access denied to this classroom' 
      });
    }

    const ActivityLog = require('../models/ActivityLog');
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = {
      classroomId: classroomId,
      role: 'teacher'
    };
    
    // Add teacher role filter if specified
    if (teacherRole && ['main_teacher', 'co_teacher'].includes(teacherRole)) {
      query.teacherRole = teacherRole;
    }
    
    const logs = await ActivityLog.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalLogs = await ActivityLog.countDocuments(query);

    // Calculate separate counts for main teacher and co-teacher
    const mainTeacherLogs = await ActivityLog.countDocuments({
      classroomId: classroomId,
      role: 'teacher',
      teacherRole: 'main_teacher'
    });
    
    const coTeacherLogs = await ActivityLog.countDocuments({
      classroomId: classroomId,
      role: 'teacher',
      teacherRole: 'co_teacher'
    });

    res.json({
      logs,
      statistics: {
        totalLogs,
        mainTeacherLogs,
        coTeacherLogs
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalLogs / parseInt(limit)),
        totalLogs,
        hasNext: skip + logs.length < totalLogs,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get classroom activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
