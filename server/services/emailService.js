const nodemailer = require('nodemailer');
const { renderEmailTemplate } = require('./emailTemplateService');

// Check if email service is configured
const isEmailConfigured = () => {
  return process.env.MAIL_USER && process.env.MAIL_PASS;
};

// Create transporter with Gmail SMTP (only if configured)
let transporter = null;

if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  // Verify transporter configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.error('Email service error:', error);
    } else {
      console.log('Email service is ready to send messages');
    }
  });
} else {
  console.log('Email service not configured. Set MAIL_USER and MAIL_PASS environment variables to enable email notifications.');
}

// Send email function
const sendEmail = async (to, subject, html, text = null) => {
  if (!isEmailConfigured()) {
    console.log('Email service not configured, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send notification email
const sendNotificationEmail = async (userEmail, userName, notification) => {
  if (!isEmailConfigured()) {
    console.log('Email service not configured, skipping notification email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const template = await renderEmailTemplate('notification', {
      userName,
      title: notification.title,
      message: notification.message
    });

    return await sendEmail(userEmail, template.subject, template.bodyHtml, template.bodyText);
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { success: false, error: error.message };
  }
};

// Send task assignment email
const sendTaskAssignmentEmail = async (studentEmail, studentName, taskTitle, classroomName, teacherName) => {
  if (!isEmailConfigured()) {
    console.log('Email service not configured, skipping task assignment email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const template = await renderEmailTemplate('task_assignment', {
      studentName,
      taskTitle,
      classroomName,
      teacherName
    });

    return await sendEmail(studentEmail, template.subject, template.bodyHtml, template.bodyText);
  } catch (error) {
    console.error('Error sending task assignment email:', error);
    return { success: false, error: error.message };
  }
};

// Send task submission notification email
const sendTaskSubmissionEmail = async (teacherEmail, teacherName, studentName, taskTitle, isAutoSubmission = false) => {
  if (!isEmailConfigured()) {
    console.log('Email service not configured, skipping task submission email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const template = await renderEmailTemplate('task_submission', {
      teacherName,
      studentName,
      taskTitle,
      isAutoSubmission: isAutoSubmission ? 'Auto-' : '',
      isAutoSubmissionText: isAutoSubmission ? 'The system has automatically submitted draft submissions for a task:' : 'A student has submitted a task:',
      isAutoSubmissionColor: isAutoSubmission ? '#dc3545' : '#ffc107',
      isAutoSubmissionLabel: isAutoSubmission ? 'Auto-submitted by:' : 'Submitted by:',
      isAutoSubmissionWarning: isAutoSubmission ? '<p style="color: #dc3545; font-weight: bold;">⚠️ This submission was automatically submitted due to the deadline passing.</p>' : '',
      isAutoSubmissionPlural: isAutoSubmission ? 's' : ''
    });

    return await sendEmail(teacherEmail, template.subject, template.bodyHtml, template.bodyText);
  } catch (error) {
    console.error('Error sending task submission email:', error);
    return { success: false, error: error.message };
  }
};

// Send auto-submission notification email to student
const sendAutoSubmissionNotificationEmail = async (studentEmail, studentName, taskTitle, classroomName) => {
  if (!isEmailConfigured()) {
    console.log('Email service not configured, skipping auto-submission notification email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const template = await renderEmailTemplate('auto_submission_notification', {
      studentName,
      taskTitle,
      classroomName
    });

    return await sendEmail(studentEmail, template.subject, template.bodyHtml, template.bodyText);
  } catch (error) {
    console.error('Error sending auto-submission notification email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email with OTP and link
const sendPasswordResetEmail = async (userEmail, userName, otp, resetLink) => {
  if (!isEmailConfigured()) {
    console.log('Email service not configured, skipping password reset email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const template = await renderEmailTemplate('password_reset', {
      userName,
      otp,
      resetLink
    });

    return await sendEmail(userEmail, template.subject, template.bodyHtml, template.bodyText);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendNotificationEmail,
  sendTaskAssignmentEmail,
  sendTaskSubmissionEmail,
  sendAutoSubmissionNotificationEmail,
  isEmailConfigured,
  sendPasswordResetEmail
};

// Helper: Send welcome email to newly created teacher (admin-created)
const sendTeacherWelcomeEmail = async (teacherEmail, teacherName, tempPassword, createdByName) => {
  if (!isEmailConfigured()) {
    console.log('Email service not configured, skipping teacher welcome email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const template = await renderEmailTemplate('teacher_welcome', {
      teacherName,
      teacherEmail,
      tempPassword,
      createdByName: createdByName || 'Admin'
    });

    return await sendEmail(teacherEmail, template.subject, template.bodyHtml, template.bodyText);
  } catch (error) {
    console.error('Error sending teacher welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports.sendTeacherWelcomeEmail = sendTeacherWelcomeEmail;
