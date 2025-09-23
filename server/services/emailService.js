const nodemailer = require('nodemailer');

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

  const subject = `New Notification: ${notification.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${userName},</h2>
      <p>You have received a new notification:</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #007bff; margin-top: 0;">${notification.title}</h3>
        <p style="color: #666; margin-bottom: 0;">${notification.message}</p>
      </div>
      <p style="color: #999; font-size: 14px;">
        This is an automated notification from your education platform.
      </p>
    </div>
  `;

  return await sendEmail(userEmail, subject, html);
};

// Send task assignment email
const sendTaskAssignmentEmail = async (studentEmail, studentName, taskTitle, classroomName, teacherName) => {
  if (!isEmailConfigured()) {
    console.log('Email service not configured, skipping task assignment email');
    return { success: false, error: 'Email service not configured' };
  }

  const subject = `New Task Assigned: ${taskTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${studentName},</h2>
      <p>A new task has been assigned to you:</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #28a745; margin-top: 0;">${taskTitle}</h3>
        <p><strong>Classroom:</strong> ${classroomName}</p>
        <p><strong>Assigned by:</strong> ${teacherName}</p>
      </div>
      <p style="color: #999; font-size: 14px;">
        Please log in to your account to view the complete task details and submit your work.
      </p>
    </div>
  `;

  return await sendEmail(studentEmail, subject, html);
};

// Send task submission notification email
const sendTaskSubmissionEmail = async (teacherEmail, teacherName, studentName, taskTitle, isAutoSubmission = false) => {
  if (!isEmailConfigured()) {
    console.log('Email service not configured, skipping task submission email');
    return { success: false, error: 'Email service not configured' };
  }

  const subject = isAutoSubmission ? `Auto-Submission Completed: ${taskTitle}` : `Task Submitted: ${taskTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${teacherName},</h2>
      <p>${isAutoSubmission ? 'The system has automatically submitted draft submissions for a task:' : 'A student has submitted a task:'}</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: ${isAutoSubmission ? '#dc3545' : '#ffc107'}; margin-top: 0;">${taskTitle}</h3>
        <p><strong>${isAutoSubmission ? 'Auto-submitted by:' : 'Submitted by:'}</strong> ${studentName}</p>
        ${isAutoSubmission ? '<p style="color: #dc3545; font-weight: bold;">⚠️ This submission was automatically submitted due to the deadline passing.</p>' : ''}
      </div>
      <p style="color: #999; font-size: 14px;">
        Please log in to your account to review the submission${isAutoSubmission ? 's' : ''} and provide feedback.
      </p>
    </div>
  `;

  return await sendEmail(teacherEmail, subject, html);
};

// Send auto-submission notification email to student
const sendAutoSubmissionNotificationEmail = async (studentEmail, studentName, taskTitle, classroomName) => {
  if (!isEmailConfigured()) {
    console.log('Email service not configured, skipping auto-submission notification email');
    return { success: false, error: 'Email service not configured' };
  }

  const subject = `Task Auto-Submitted: ${taskTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${studentName},</h2>
      <p>Your draft submission has been automatically submitted due to the deadline:</p>
      <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-top: 0;">${taskTitle}</h3>
        <p><strong>Classroom:</strong> ${classroomName}</p>
        <p style="color: #856404; font-weight: bold;">⚠️ Your draft submission was automatically submitted because the deadline has passed.</p>
      </div>
      <p style="color: #999; font-size: 14px;">
        Please log in to your account to view the submission status and any feedback from your teacher.
      </p>
    </div>
  `;

  return await sendEmail(studentEmail, subject, html);
};

// Send password reset email with OTP and link
const sendPasswordResetEmail = async (userEmail, userName, otp, resetLink) => {
  if (!isEmailConfigured()) {
    console.log('Email service not configured, skipping password reset email');
    return { success: false, error: 'Email service not configured' };
  }

  const subject = 'Password Reset Instructions';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${userName},</h2>
      <p>We received a request to reset your password. Use the OTP below or click the reset link:</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 16px; color: #333; margin: 0 0 8px;">Your OTP:</p>
        <div style="font-size: 28px; letter-spacing: 4px; font-weight: bold; color: #007bff;">${otp}</div>
      </div>
      <p>You can also reset your password using this link (valid for 5 minutes):</p>
      <p><a href="${resetLink}" style="display: inline-block; background: #007bff; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none;">Reset Password</a></p>
      <p style="color: #999; font-size: 14px;">If you did not request a password reset, you can ignore this email.</p>
    </div>
  `;

  return await sendEmail(userEmail, subject, html);
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

  const subject = 'Welcome to the Platform (Teacher Account Created)';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${teacherName},</h2>
      <p>Your teacher account has been created by ${createdByName || 'Admin'}.</p>
      <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 6px; color: #333;"><strong>Login Email:</strong> ${teacherEmail}</p>
        <p style="margin: 0 0 6px; color: #333;"><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      <p style="color: #666;">For security, please sign in and change your password immediately.</p>
      <p style="color: #999; font-size: 13px;">This is an automated message. Please do not reply.</p>
    </div>
  `;

  return await sendEmail(teacherEmail, subject, html);
};

module.exports.sendTeacherWelcomeEmail = sendTeacherWelcomeEmail;
