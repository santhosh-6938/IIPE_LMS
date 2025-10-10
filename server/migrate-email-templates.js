const mongoose = require('mongoose');
require('dotenv').config();

const EmailTemplate = require('./models/EmailTemplate');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Initial email templates data
const initialTemplates = [
  {
    templateName: 'notification',
    subject: 'New Notification: {{title}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hello {{userName}},</h2>
        <p>You have received a new notification:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">{{title}}</h3>
          <p style="color: #666; margin-bottom: 0;">{{message}}</p>
        </div>
        <p style="color: #999; font-size: 14px;">
          This is an automated notification from your education platform.
        </p>
      </div>
    `,
    bodyText: `Hello {{userName}},\n\nYou have received a new notification:\n\n{{title}}\n{{message}}\n\nThis is an automated notification from your education platform.`,
    description: 'General notification email template',
    variables: ['userName', 'title', 'message']
  },
  {
    templateName: 'task_assignment',
    subject: 'New Task Assigned: {{taskTitle}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hello {{studentName}},</h2>
        <p>A new task has been assigned to you:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #28a745; margin-top: 0;">{{taskTitle}}</h3>
          <p><strong>Classroom:</strong> {{classroomName}}</p>
          <p><strong>Assigned by:</strong> {{teacherName}}</p>
        </div>
        <p style="color: #999; font-size: 14px;">
          Please log in to your account to view the complete task details and submit your work.
        </p>
      </div>
    `,
    bodyText: `Hello {{studentName}},\n\nA new task has been assigned to you:\n\n{{taskTitle}}\nClassroom: {{classroomName}}\nAssigned by: {{teacherName}}\n\nPlease log in to your account to view the complete task details and submit your work.`,
    description: 'Task assignment notification email template',
    variables: ['studentName', 'taskTitle', 'classroomName', 'teacherName']
  },
  {
    templateName: 'task_submission',
    subject: '{{isAutoSubmission}}Task {{isAutoSubmission}}Submitted: {{taskTitle}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hello {{teacherName}},</h2>
        <p>{{isAutoSubmissionText}}</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: {{isAutoSubmissionColor}}; margin-top: 0;">{{taskTitle}}</h3>
          <p><strong>{{isAutoSubmissionLabel}}</strong> {{studentName}}</p>
          {{isAutoSubmissionWarning}}
        </div>
        <p style="color: #999; font-size: 14px;">
          Please log in to your account to review the submission{{isAutoSubmissionPlural}} and provide feedback.
        </p>
      </div>
    `,
    bodyText: `Hello {{teacherName}},\n\n{{isAutoSubmissionText}}\n\n{{taskTitle}}\n{{isAutoSubmissionLabel}} {{studentName}}\n\nPlease log in to your account to review the submission{{isAutoSubmissionPlural}} and provide feedback.`,
    description: 'Task submission notification email template',
    variables: ['teacherName', 'studentName', 'taskTitle', 'isAutoSubmission', 'isAutoSubmissionText', 'isAutoSubmissionColor', 'isAutoSubmissionLabel', 'isAutoSubmissionWarning', 'isAutoSubmissionPlural']
  },
  {
    templateName: 'auto_submission_notification',
    subject: 'Task Auto-Submitted: {{taskTitle}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hello {{studentName}},</h2>
        <p>Your draft submission has been automatically submitted due to the deadline:</p>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; margin-top: 0;">{{taskTitle}}</h3>
          <p><strong>Classroom:</strong> {{classroomName}}</p>
          <p style="color: #856404; font-weight: bold;">⚠️ Your draft submission was automatically submitted because the deadline has passed.</p>
        </div>
        <p style="color: #999; font-size: 14px;">
          Please log in to your account to view the submission status and any feedback from your teacher.
        </p>
      </div>
    `,
    bodyText: `Hello {{studentName}},\n\nYour draft submission has been automatically submitted due to the deadline:\n\n{{taskTitle}}\nClassroom: {{classroomName}}\n\n⚠️ Your draft submission was automatically submitted because the deadline has passed.\n\nPlease log in to your account to view the submission status and any feedback from your teacher.`,
    description: 'Auto-submission notification email template for students',
    variables: ['studentName', 'taskTitle', 'classroomName']
  },
  {
    templateName: 'password_reset',
    subject: 'Password Reset Instructions',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hello {{userName}},</h2>
        <p>We received a request to reset your password. Use the OTP below or click the reset link:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 16px; color: #333; margin: 0 0 8px;">Your OTP:</p>
          <div style="font-size: 28px; letter-spacing: 4px; font-weight: bold; color: #007bff;">{{otp}}</div>
        </div>
        <p>You can also reset your password using this link (valid for 5 minutes):</p>
        <p><a href="{{resetLink}}" style="display: inline-block; background: #007bff; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none;">Reset Password</a></p>
        <p style="color: #999; font-size: 14px;">If you did not request a password reset, you can ignore this email.</p>
      </div>
    `,
    bodyText: `Hello {{userName}},\n\nWe received a request to reset your password. Use the OTP below or click the reset link:\n\nYour OTP: {{otp}}\n\nReset Link: {{resetLink}}\n\nIf you did not request a password reset, you can ignore this email.`,
    description: 'Password reset email template with OTP and reset link',
    variables: ['userName', 'otp', 'resetLink']
  },
  {
    templateName: 'teacher_welcome',
    subject: 'Welcome to the Platform (Teacher Account Created)',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hello {{teacherName}},</h2>
        <p>Your teacher account has been created by {{createdByName}}.</p>
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 6px; color: #333;"><strong>Login Email:</strong> {{teacherEmail}}</p>
          <p style="margin: 0 0 6px; color: #333;"><strong>Temporary Password:</strong> {{tempPassword}}</p>
        </div>
        <p style="color: #666;">For security, please sign in and change your password immediately.</p>
        <p style="color: #999; font-size: 13px;">This is an automated message. Please do not reply.</p>
      </div>
    `,
    bodyText: `Hello {{teacherName}},\n\nYour teacher account has been created by {{createdByName}}.\n\nLogin Email: {{teacherEmail}}\nTemporary Password: {{tempPassword}}\n\nFor security, please sign in and change your password immediately.\n\nThis is an automated message. Please do not reply.`,
    description: 'Welcome email template for newly created teacher accounts',
    variables: ['teacherName', 'teacherEmail', 'tempPassword', 'createdByName']
  }
  ,
  {
    templateName: 'teacher_blocked',
    subject: 'Your IIPE LMS account has been blocked',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color:#b91c1c;">Account Blocked</h2>
        <p>Dear {{teacherName}},</p>
        <p>Your IIPE LMS account has been <strong>blocked</strong>.</p>
        <p><strong>Reason:</strong> {{reason}}</p>
        <p><strong>Blocked At:</strong> {{blockedAt}}</p>
        <p>If you believe this is a mistake, please contact the admin.</p>
        <p>Regards,<br/>{{adminName}}</p>
      </div>
    `,
    bodyText: `Account Blocked\n\nDear {{teacherName}},\nYour IIPE LMS account has been blocked.\nReason: {{reason}}\nBlocked At: {{blockedAt}}\nPlease contact admin if this is a mistake.\nRegards, {{adminName}}`,
    description: 'Email to teacher when account is blocked',
    variables: ['teacherName','reason','blockedAt','adminName']
  },
  {
    templateName: 'teacher_unblocked',
    subject: 'Your IIPE LMS account has been unblocked',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color:#16a34a;">Account Unblocked</h2>
        <p>Dear {{teacherName}},</p>
        <p>Your IIPE LMS account has been <strong>unblocked</strong> and access is restored.</p>
        <p><strong>Unblocked At:</strong> {{unblockedAt}}</p>
        <p>Regards,<br/>{{adminName}}</p>
      </div>
    `,
    bodyText: `Account Unblocked\n\nDear {{teacherName}},\nYour IIPE LMS account has been unblocked.\nUnblocked At: {{unblockedAt}}\nRegards, {{adminName}}`,
    description: 'Email to teacher when account is unblocked',
    variables: ['teacherName','unblockedAt','adminName']
  }
];

// Migration function
const migrateEmailTemplates = async () => {
  try {
    console.log('Starting email templates migration...');

    // Check if templates already exist
    const existingTemplates = await EmailTemplate.find({});
    if (existingTemplates.length > 0) {
      console.log(`Found ${existingTemplates.length} existing templates. Updating...`);
      
      // Update existing templates
      for (const templateData of initialTemplates) {
        await EmailTemplate.findOneAndUpdate(
          { templateName: templateData.templateName },
          { 
            ...templateData,
            updatedAt: new Date()
          },
          { upsert: true, new: true, runValidators: true }
        );
        console.log(`✓ Updated template: ${templateData.templateName}`);
      }
    } else {
      console.log('No existing templates found. Creating new templates...');
      
      // Create new templates
      for (const templateData of initialTemplates) {
        const template = new EmailTemplate(templateData);
        await template.save();
        console.log(`✓ Created template: ${templateData.templateName}`);
      }
    }

    console.log('\n✅ Email templates migration completed successfully!');
    console.log(`📧 ${initialTemplates.length} email templates are now available in the database.`);
    
    // Display summary
    const allTemplates = await EmailTemplate.find({ isActive: true });
    console.log('\n📋 Available email templates:');
    allTemplates.forEach(template => {
      console.log(`  - ${template.templateName}: ${template.description}`);
    });

  } catch (error) {
    console.error('❌ Error during email templates migration:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateEmailTemplates()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateEmailTemplates, initialTemplates };
