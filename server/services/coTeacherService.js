const crypto = require('crypto');
const CoTeacher = require('../models/CoTeacher');
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');
const { renderEmailTemplate } = require('./emailTemplateService');

// Generate secure invitation token
const generateInvitationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send co-teacher invitation email
const sendCoTeacherInvitationEmail = async (invitationData) => {
  try {
    const { coTeacherEmail, mainTeacherName, classroomName, classroomSubject, classroomDescription, invitationToken, invitationMessage } = invitationData;
    
    // Create invitation URL (this would be handled by frontend)
    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/co-teacher/invitation/${invitationToken}`;
    
    const template = await renderEmailTemplate('co_teacher_invitation', {
      mainTeacherName,
      classroomName,
      classroomSubject: classroomSubject || 'Not specified',
      classroomDescription: classroomDescription || 'No description provided',
      invitationUrl,
      invitationMessage: invitationMessage || 'You have been invited to collaborate as a co-teacher.',
      expiresIn: '7 days'
    });

    return await sendEmail(coTeacherEmail, template.subject, template.bodyHtml, template.bodyText);
  } catch (error) {
    console.error('Error rendering co-teacher invitation email template:', error);
    throw error;
  }
};

// Invite co-teacher to classroom
const inviteCoTeacher = async (classroomId, mainTeacherId, coTeacherEmail, invitationMessage = '') => {
  try {
    // Validate classroom exists and main teacher owns it
    const classroom = await Classroom.findById(classroomId)
      .populate('teacher', 'name email');
    
    if (!classroom) {
      return {
        success: false,
        message: 'Classroom not found',
        code: 'CLASSROOM_NOT_FOUND'
      };
    }

    if (classroom.teacher._id.toString() !== mainTeacherId.toString()) {
      return {
        success: false,
        message: 'Access denied. Only the main teacher can invite co-teachers.',
        code: 'ACCESS_DENIED'
      };
    }

    // Check if co-teacher is already invited or exists
    const existingInvitation = await CoTeacher.findOne({
      classroom: classroomId,
      invitationEmail: coTeacherEmail.toLowerCase(),
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingInvitation) {
      return {
        success: false,
        message: 'Co-teacher has already been invited to this classroom',
        code: 'ALREADY_INVITED'
      };
    }

    // Check if user exists with this email
    const existingUser = await User.findOne({ 
      email: coTeacherEmail.toLowerCase(),
      role: 'teacher'
    });

    if (!existingUser) {
      return {
        success: false,
        message: 'No teacher account found with this email address',
        code: 'TEACHER_NOT_FOUND'
      };
    }

    // Check if this teacher is already a co-teacher in this classroom
    if (classroom.coTeacher && classroom.coTeacher.toString() === existingUser._id.toString()) {
      return {
        success: false,
        message: 'This teacher is already a co-teacher in this classroom',
        code: 'ALREADY_CO_TEACHER'
      };
    }

    // Generate invitation token
    const invitationToken = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation record
    const invitation = new CoTeacher({
      classroom: classroomId,
      mainTeacher: mainTeacherId,
      coTeacher: existingUser._id,
      invitationToken,
      invitationEmail: coTeacherEmail.toLowerCase(),
      invitationMessage: invitationMessage.trim(),
      expiresAt,
      invitedBy: mainTeacherId
    });

    await invitation.save();

    // Create notification for the co-teacher
    try {
      const notification = new Notification({
        recipient: existingUser._id,
        sender: mainTeacherId,
        type: 'co_teacher_invitation',
        title: 'Co-Teacher Invitation',
        message: `You have been invited by ${classroom.teacher.name} to collaborate as a co-teacher for "${classroom.name}"`,
        data: {
          classroomId: classroomId,
          coTeacherInvitationId: invitation._id,
          invitationToken: invitationToken
        }
      });
      await notification.save();
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the invitation if notification creation fails
    }

    // Send invitation email
    try {
      const emailResult = await sendCoTeacherInvitationEmail({
        coTeacherEmail: coTeacherEmail.toLowerCase(),
        mainTeacherName: classroom.teacher.name,
        classroomName: classroom.name,
        classroomSubject: classroom.subject,
        classroomDescription: classroom.description,
        invitationToken,
        invitationMessage: invitationMessage.trim()
      });

      if (!emailResult.success) {
        // If email fails, delete the invitation
        await CoTeacher.findByIdAndDelete(invitation._id);
        return {
          success: false,
          message: 'Failed to send invitation email. Please try again.',
          code: 'EMAIL_SEND_FAILED'
        };
      }
    } catch (emailError) {
      console.error('Failed to send co-teacher invitation email:', emailError);
      await CoTeacher.findByIdAndDelete(invitation._id);
      return {
        success: false,
        message: 'Failed to send invitation email. Please try again.',
        code: 'EMAIL_SEND_FAILED'
      };
    }

    return {
      success: true,
      message: 'Co-teacher invitation sent successfully',
      invitation: {
        id: invitation._id,
        coTeacherEmail: invitation.invitationEmail,
        expiresAt: invitation.expiresAt,
        status: invitation.status
      }
    };

  } catch (error) {
    console.error('Invite co-teacher error:', error);
    return {
      success: false,
      message: 'Failed to invite co-teacher. Please try again.',
      code: 'INTERNAL_ERROR'
    };
  }
};

// Accept co-teacher invitation
const acceptCoTeacherInvitation = async (invitationToken) => {
  try {
    const invitation = await CoTeacher.findOne({
      invitationToken,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('classroom coTeacher mainTeacher');

    if (!invitation) {
      return {
        success: false,
        message: 'Invalid or expired invitation',
        code: 'INVALID_OR_EXPIRED'
      };
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    await invitation.save();

    // Update classroom with co-teacher
    const classroom = invitation.classroom;
    classroom.coTeacher = invitation.coTeacher._id;
    classroom.coTeacherEnabled = true;
    await classroom.save();

    // Create notification for the main teacher
    try {
      const notification = new Notification({
        recipient: invitation.mainTeacher._id,
        sender: invitation.coTeacher._id,
        type: 'co_teacher_accepted',
        title: 'Co-Teacher Invitation Accepted',
        message: `${invitation.coTeacher.name} has accepted your co-teacher invitation for "${classroom.name}"`,
        data: {
          classroomId: classroom._id,
          coTeacherInvitationId: invitation._id
        }
      });
      await notification.save();
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the acceptance if notification creation fails
    }

    return {
      success: true,
      message: 'Co-teacher invitation accepted successfully',
      classroom: {
        id: classroom._id,
        name: classroom.name,
        mainTeacher: invitation.mainTeacher.name
      }
    };

  } catch (error) {
    console.error('Accept co-teacher invitation error:', error);
    return {
      success: false,
      message: 'Failed to accept invitation. Please try again.',
      code: 'INTERNAL_ERROR'
    };
  }
};

// Decline co-teacher invitation
const declineCoTeacherInvitation = async (invitationToken, declineReason = '') => {
  try {
    const invitation = await CoTeacher.findOne({
      invitationToken,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('classroom coTeacher mainTeacher');

    if (!invitation) {
      return {
        success: false,
        message: 'Invalid or expired invitation',
        code: 'INVALID_OR_EXPIRED'
      };
    }

    // Update invitation status
    invitation.status = 'declined';
    invitation.respondedAt = new Date();
    invitation.declineReason = declineReason.trim();
    await invitation.save();

    // Create notification for the main teacher
    try {
      const notification = new Notification({
        recipient: invitation.mainTeacher._id,
        sender: invitation.coTeacher._id,
        type: 'co_teacher_declined',
        title: 'Co-Teacher Invitation Declined',
        message: `${invitation.coTeacher.name} has declined your co-teacher invitation for "${invitation.classroom.name}"`,
        data: {
          classroomId: invitation.classroom._id,
          coTeacherInvitationId: invitation._id,
          declineReason: declineReason.trim()
        }
      });
      await notification.save();
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the decline if notification creation fails
    }

    return {
      success: true,
      message: 'Co-teacher invitation declined'
    };

  } catch (error) {
    console.error('Decline co-teacher invitation error:', error);
    return {
      success: false,
      message: 'Failed to decline invitation. Please try again.',
      code: 'INTERNAL_ERROR'
    };
  }
};

// Remove co-teacher from classroom
const removeCoTeacher = async (classroomId, mainTeacherId) => {
  try {
    const classroom = await Classroom.findById(classroomId);
    
    if (!classroom) {
      return {
        success: false,
        message: 'Classroom not found',
        code: 'CLASSROOM_NOT_FOUND'
      };
    }

    if (classroom.teacher.toString() !== mainTeacherId.toString()) {
      return {
        success: false,
        message: 'Access denied. Only the main teacher can remove co-teachers.',
        code: 'ACCESS_DENIED'
      };
    }

    if (!classroom.coTeacher) {
      return {
        success: false,
        message: 'No co-teacher assigned to this classroom',
        code: 'NO_CO_TEACHER'
      };
    }

    // Remove co-teacher from classroom
    classroom.coTeacher = null;
    classroom.coTeacherEnabled = false;
    await classroom.save();

    // Update any pending invitations for this classroom
    await CoTeacher.updateMany(
      { classroom: classroomId, status: 'pending' },
      { status: 'expired' }
    );

    return {
      success: true,
      message: 'Co-teacher removed successfully'
    };

  } catch (error) {
    console.error('Remove co-teacher error:', error);
    return {
      success: false,
      message: 'Failed to remove co-teacher. Please try again.',
      code: 'INTERNAL_ERROR'
    };
  }
};

// Get co-teacher invitations for a classroom
const getCoTeacherInvitations = async (classroomId, mainTeacherId) => {
  try {
    const classroom = await Classroom.findById(classroomId);
    
    if (!classroom) {
      return {
        success: false,
        message: 'Classroom not found',
        code: 'CLASSROOM_NOT_FOUND'
      };
    }

    if (classroom.teacher.toString() !== mainTeacherId.toString()) {
      return {
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      };
    }

    const invitations = await CoTeacher.find({ classroom: classroomId })
      .populate('coTeacher', 'name email')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    return {
      success: true,
      invitations
    };

  } catch (error) {
    console.error('Get co-teacher invitations error:', error);
    return {
      success: false,
      message: 'Failed to get invitations. Please try again.',
      code: 'INTERNAL_ERROR'
    };
  }
};

// Get classrooms where user is co-teacher
const getCoTeacherClassrooms = async (coTeacherId) => {
  try {
    const classrooms = await Classroom.find({
      coTeacher: coTeacherId,
      coTeacherEnabled: true,
      isArchived: false
    })
      .populate('teacher', 'name email')
      .populate('coTeacher', 'name email')
      .populate('students', 'name email rollNumber')
      .sort({ createdAt: -1 });

    return {
      success: true,
      classrooms
    };

  } catch (error) {
    console.error('Get co-teacher classrooms error:', error);
    return {
      success: false,
      message: 'Failed to get co-teacher classrooms. Please try again.',
      code: 'INTERNAL_ERROR'
    };
  }
};

// Check if user has access to classroom (main teacher or co-teacher)
const hasClassroomAccess = async (classroomId, userId) => {
  try {
    const classroom = await Classroom.findById(classroomId);
    
    if (!classroom) {
      return false;
    }

    // Check if user is main teacher
    if (classroom.teacher.toString() === userId.toString()) {
      return { hasAccess: true, role: 'main_teacher' };
    }

    // Check if user is co-teacher
    if (classroom.coTeacherEnabled && 
        classroom.coTeacher && 
        classroom.coTeacher.toString() === userId.toString()) {
      return { hasAccess: true, role: 'co_teacher' };
    }

    return { hasAccess: false, role: null };

  } catch (error) {
    console.error('Check classroom access error:', error);
    return { hasAccess: false, role: null };
  }
};

// Send notification to both main teacher and co-teacher about classroom activity
const notifyBothTeachers = async (classroomId, senderId, type, title, message, data = {}) => {
  try {
    const classroom = await Classroom.findById(classroomId)
      .populate('teacher', 'name email')
      .populate('coTeacher', 'name email');
    
    if (!classroom) {
      console.warn('Classroom not found for notification');
      return;
    }

    // Notify main teacher if they're not the sender
    if (classroom.teacher._id.toString() !== senderId.toString()) {
      try {
        const mainTeacherNotification = new Notification({
          recipient: classroom.teacher._id,
          sender: senderId,
          type,
          title,
          message,
          data: {
            ...data,
            classroomId,
            isMainTeacher: true
          }
        });
        await mainTeacherNotification.save();
      } catch (error) {
        console.error('Failed to create notification for main teacher:', error);
      }
    }

    // Notify co-teacher if enabled and they're not the sender
    if (classroom.coTeacherEnabled && 
        classroom.coTeacher && 
        classroom.coTeacher._id.toString() !== senderId.toString()) {
      try {
        const coTeacherNotification = new Notification({
          recipient: classroom.coTeacher._id,
          sender: senderId,
          type,
          title,
          message,
          data: {
            ...data,
            classroomId,
            isCoTeacher: true
          }
        });
        await coTeacherNotification.save();
      } catch (error) {
        console.error('Failed to create notification for co-teacher:', error);
      }
    }
  } catch (error) {
    console.error('Failed to send notifications to both teachers:', error);
  }
};

module.exports = {
  inviteCoTeacher,
  acceptCoTeacherInvitation,
  declineCoTeacherInvitation,
  removeCoTeacher,
  getCoTeacherInvitations,
  getCoTeacherClassrooms,
  hasClassroomAccess,
  notifyBothTeachers
};
