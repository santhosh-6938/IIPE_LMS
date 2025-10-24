const mongoose = require('mongoose');
const EmailTemplate = require('./models/EmailTemplate');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for email template migration'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define all email templates that need to be migrated to database
const emailTemplates = [
  {
    templateName: 'email_verification_signup',
    subject: 'Verify Your Email - IIPE LMS Registration',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">IIPE LMS</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{userName}},</h2>
          <p style="color: #666; margin-bottom: 20px;">
            Please verify your email address to complete your registration.
          </p>
          <div style="background: white; border: 2px dashed #667eea; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">{{otp}}</span>
          </div>
          <p style="color: #e74c3c; font-weight: bold; margin: 20px 0;">
            ⚠️ This code will expire in 2 minutes
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you didn't request this verification, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 IIPE LMS. All rights reserved.</p>
        </div>
      </div>
    `,
    bodyText: `
      IIPE LMS - Email Verification
      
      Hello {{userName}},
      
      Please verify your email address to complete your registration.
      
      Your verification code is: {{otp}}
      
      ⚠️ This code will expire in 2 minutes
      
      If you didn't request this verification, please ignore this email.
      
      © 2024 IIPE LMS. All rights reserved.
    `,
    description: 'Email verification template for user registration',
    variables: ['userName', 'otp']
  },
  {
    templateName: 'email_verification_login',
    subject: 'Alice Your Email - IIPE LMS Login',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">IIPE LMS</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{userName}},</h2>
          <p style="color: #666; margin-bottom: 20px;">
            Please verify your email address to complete your login.
          </p>
          <div style="background: white; border: 2px dashed #667eea; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">{{otp}}</span>
          </div>
          <p style="color: #e74c3c; font-weight: bold; margin: 20px 0;">
            ⚠️ This code will expire in 2 minutes
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you didn't request this verification, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 IIPE LMS. All rights reserved.</p>
        </div>
      </div>
    `,
    bodyText: `
      IIPE LMS - Email Verification
      
      Hello {{userName}},
      
      Please verify your email address to complete your login.
      
      Your verification code is: {{otp}}
      
      ⚠️ This code will expire in 2 minutes
      
      If you didn't request this verification, please ignore this email.
      
      © 2024 IIPE LMS. All rights reserved.
    `,
    description: 'Email verification template for user login',
    variables: ['userName', 'otp']
  },
  {
    templateName: 'concurrent_login_alert',
    subject: 'Concurrent Login Attempt Detected - IIPE LMS',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Security Alert</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Concurrent Login Attempt</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{userName}},</h2>
          <p style="color: #666; margin-bottom: 20px;">
            We detected a login attempt from a different device while you're already logged in.
          </p>
          
          <div style="background: white; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
            <h3 style="color: #e74c3c; margin: 0 0 10px 0;">Login Attempt Details:</h3>
            <p style="margin: 5px 0;"><strong>IP Address:</strong> {{ipAddress}}</p>
            <p style="margin: 5px 0;"><strong>Device:</strong> {{userAgent}}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> {{timestamp}}</p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;">
              <strong>Action Required:</strong> Please check your IIPE LMS dashboard to approve or deny this login attempt.
            </p>
          </div>
          
          <p style="color: #666; margin-top: 20px;">
            If this wasn't you, please deny the request and consider changing your password.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 IIPE LMS. All rights reserved.</p>
        </div>
      </div>
    `,
    bodyText: `
      IIPE LMS - Security Alert
      
      Hello {{userName}},
      
      We detected a login attempt from a different device while you're already logged in.
      
      Login Attempt Details:
      IP Address: {{ipAddress}}
      Device: {{userAgent}}
      Time: {{timestamp}}
      
      Action Required: Please check your IIPE LMS dashboard to approve or deny this login attempt.
      
      If this wasn't you, please deny the request and consider changing your password.
      
      © 2024 IIPE LMS. All rights reserved.
    `,
    description: 'Security alert email for concurrent login attempts',
    variables: ['userName', 'ipAddress', 'userAgent', 'timestamp']
  },
  {
    templateName: 'notification',
    subject: '{{title}} - IIPE LMS',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">IIPE LMS</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Notification</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{userName}},</h2>
          <h3 style="color: #667eea; margin-bottom: 15px;">{{title}}</h3>
          <p style="color: #666; margin-bottom: 20px; line-height: 1.6;">
            {{message}}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 IIPE LMS. All rights reserved.</p>
        </div>
      </div>
    `,
    bodyText: `
      IIPE LMS - Notification
      
      Hello {{userName}},
      
      {{title}}
      
      {{message}}
      
      © 2024 IIPE LMS. All rights reserved.
    `,
    description: 'General notification email template',
    variables: ['userName', 'title', 'message']
  },
  {
    templateName: 'task_assignment',
    subject: 'New Task Assigned - {{taskTitle}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">IIPE LMS</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">New Task Assignment</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{studentName}},</h2>
          <p style="color: #666; margin-bottom: 20px;">
            A new task has been assigned to you in {{classroomName}}.
          </p>
          
          <div style="background: white; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
            <h3 style="color: #28a745; margin: 0 0 10px 0;">Task Details:</h3>
            <p style="margin: 5px 0;"><strong>Task:</strong> {{taskTitle}}</p>
            <p style="margin: 5px 0;"><strong>Classroom:</strong> {{classroomName}}</p>
            <p style="margin: 5px 0;"><strong>Assigned by:</strong> {{teacherName}}</p>
          </div>
          
          <p style="color: #666; margin-top: 20px;">
            Please log in to your IIPE LMS account to view the task details and submit your work.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 IIPE LMS. All rights reserved.</p>
        </div>
      </div>
    `,
    bodyText: `
      IIPE LMS - New Task Assignment
      
      Hello {{studentName}},
      
      A new task has been assigned to you in {{classroomName}}.
      
      Task Details:
      Task: {{taskTitle}}
      Classroom: {{classroomName}}
      Assigned by: {{teacherName}}
      
      Please log in to your IIPE LMS account to view the task details and submit your work.
      
      © 2024 IIPE LMS. All rights reserved.
    `,
    description: 'Email template for task assignments to students',
    variables: ['studentName', 'taskTitle', 'classroomName', 'teacherName']
  },
  {
    templateName: 'task_submission',
    subject: 'Task Submission - {{taskTitle}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, {{isAutoSubmissionColor}} 0%, #ffc107 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">IIPE LMS</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Task Submission Notification</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{teacherName}},</h2>
          <p style="color: #666; margin-bottom: 20px;">
            {{isAutoSubmissionText}}
          </p>
          
          <div style="background: white; border-left: 4px solid {{isAutoSubmissionColor}}; padding: 15px; margin: 20px 0;">
            <h3 style="color: {{isAutoSubmissionColor}}; margin: 0 0 10px 0;">Submission Details:</h3>
            <p style="margin: 5px 0;"><strong>Task:</strong> {{taskTitle}}</p>
            <p style="margin: 5px 0;"><strong>{{isAutoSubmissionLabel}}</strong> {{studentName}}</p>
          </div>
          
          {{isAutoSubmissionWarning}}
          
          <p style="color: #666; margin-top: 20px;">
            Please log in to your IIPE LMS account to review the submission{{isAutoSubmissionPlural}}.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 IIPE LMS. All rights reserved.</p>
        </div>
      </div>
    `,
    bodyText: `
      IIPE LMS - Task Submission Notification
      
      Hello {{teacherName}},
      
      {{isAutoSubmissionText}}
      
      Submission Details:
      Task: {{taskTitle}}
      {{isAutoSubmissionLabel}} {{studentName}}
      
      {{isAutoSubmissionWarning}}
      
      Please log in to your IIPE LMS account to review the submission{{isAutoSubmissionPlural}}.
      
      © 2024 IIPE LMS. All rights reserved.
    `,
    description: 'Email template for task submission notifications to teachers',
    variables: ['teacherName', 'studentName', 'taskTitle', 'isAutoSubmission', 'isAutoSubmissionText', 'isAutoSubmissionColor', 'isAutoSubmissionLabel', 'isAutoSubmissionWarning', 'isAutoSubmissionPlural']
  },
  {
    templateName: 'auto_submission_notification',
    subject: 'Auto-Submission Notification - {{taskTitle}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">IIPE LMS</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Auto-Submission Notification</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{studentName}},</h2>
          <p style="color: #666; margin-bottom: 20px;">
            Your draft submission for the task "{{taskTitle}}" in {{classroomName}} has been automatically submitted due to the deadline passing.
          </p>
          
          <div style="background: white; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
            <h3 style="color: #dc3545; margin: 0 0 10px 0;">Auto-Submission Details:</h3>
            <p style="margin: 5px 0;"><strong>Task:</strong> {{taskTitle}}</p>
            <p style="margin: 5px 0;"><strong>Classroom:</strong> {{classroomName}}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> Automatically submitted</p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;">
              <strong>Note:</strong> This submission was made automatically to ensure you don't miss the deadline. Please check your submission in the IIPE LMS.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 IIPE LMS. All rights reserved.</p>
        </div>
      </div>
    `,
    bodyText: `
      IIPE LMS - Auto-Submission Notification
      
      Hello {{studentName}},
      
      Your draft submission for the task "{{taskTitle}}" in {{classroomName}} has been automatically submitted due to the deadline passing.
      
      Auto-Submission Details:
      Task: {{taskTitle}}
      Classroom: {{classroomName}}
      Status: Automatically submitted
      
      Note: This submission was made automatically to ensure you don't miss the deadline. Please check your submission in the IIPE LMS.
      
      © 2024 IIPE LMS. All rights reserved.
    `,
    description: 'Email template for auto-submission notifications to students',
    variables: ['studentName', 'taskTitle', 'classroomName']
  },
  {
    templateName: 'password_reset',
    subject: 'Password Reset Request - IIPE LMS',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">IIPE LMS</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{userName}},</h2>
          <p style="color: #666; margin-bottom: 20px;">
            You have requested to reset your password for your IIPE LMS account.
          </p>
          
          <div style="background: white; border: 2px dashed #667eea; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin: 0 0 10px 0;">Your Reset Code:</h3>
            <span style="font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 4px;">{{otp}}</span>
          </div>
          
          <p style="color: #666; margin-bottom: 20px;">
            Alternatively, you can use the reset link below:
          </p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{resetLink}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #e74c3c; font-weight: bold; margin: 20px 0;">
            ⚠️ This reset code and link will expire in 5 minutes
          </p>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 IIPE LMS. All rights reserved.</p>
        </div>
      </div>
    `,
    bodyText: `
      IIPE LMS - Password Reset
      
      Hello {{userName}},
      
      You have requested to reset your password for your IIPE LMS account.
      
      Your Reset Code: {{otp}}
      
      Reset Link: {{resetLink}}
      
      ⚠️ This reset code and link will expire in 5 minutes
      
      If you didn't request this password reset, please ignore this email.
      
      © 2024 IIPE LMS. All rights reserved.
    `,
    description: 'Email template for password reset requests',
    variables: ['userName', 'otp', 'resetLink']
  },
  {
    templateName: 'teacher_welcome',
    subject: 'Welcome to IIPE LMS - Your Account Details',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">IIPE LMS</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Welcome to IIPE LMS</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{teacherName}},</h2>
          <p style="color: #666; margin-bottom: 20px;">
            Welcome to IIPE LMS! Your teacher account has been created by {{createdByName}}.
          </p>
          
          <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
            <h3 style="color: #667eea; margin: 0 0 10px 0;">Your Account Details:</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> {{teacherEmail}}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> {{tempPassword}}</p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;">
              <strong>Important:</strong> Please log in and change your password immediately for security reasons.
            </p>
          </div>
          
          <p style="color: #666; margin-top: 20px;">
            You can now access your teacher dashboard and start managing your classes.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 IIPE LMS. All rights reserved.</p>
        </div>
      </div>
    `,
    bodyText: `
      IIPE LMS - Welcome
      
      Hello {{teacherName}},
      
      Welcome to IIPE LMS! Your teacher account has been created by {{createdByName}}.
      
      Your Account Details:
      Email: {{teacherEmail}}
      Temporary Password: {{tempPassword}}
      
      Important: Please log in and change your password immediately for security reasons.
      
      You can now access your teacher dashboard and start managing your classes.
      
      © 2024 IIPE LMS. All rights reserved.
    `,
    description: 'Welcome email template for newly created teacher accounts',
    variables: ['teacherName', 'teacherEmail', 'tempPassword', 'createdByName']
  },
  {
    templateName: 'teacher_blocked',
    subject: 'Account Blocked - IIPE LMS',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">IIPE LMS</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Account Blocked</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{teacherName}},</h2>
          <p style="color: #666; margin-bottom: 20px;">
            Your IIPE LMS account has been blocked by {{adminName}}.
          </p>
          
          <div style="background: white; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
            <h3 style="color: #dc3545; margin: 0 0 10px 0;">Blocking Details:</h3>
            <p style="margin: 5px 0;"><strong>Reason:</strong> {{reason}}</p>
            <p style="margin: 5px 0;"><strong>Blocked At:</strong> {{blockedAt}}</p>
            <p style="margin: 5px 0;"><strong>Blocked By:</strong> {{adminName}}</p>
          </div>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #721c24; margin: 0;">
              <strong>Action Required:</strong> Please contact the administrator to resolve this issue.
            </p>
          </div>
          
          <p style="color: #666; margin-top: 20px;">
            If you believe this is an error, please contact the administrator immediately.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 IIPE LMS. All rights reserved.</p>
        </div>
      </div>
    `,
    bodyText: `
      IIPE LMS - Account Blocked
      
      Hello {{teacherName}},
      
      Your IIPE LMS account has been blocked by {{adminName}}.
      
      Blocking Details:
      Reason: {{reason}}
      Blocked At: {{blockedAt}}
      Blocked By: {{adminName}}
      
      Action Required: Please contact the administrator to resolve this issue.
      
      If you believe this is an error, please contact the administrator immediately.
      
      © 2024 IIPE LMS. All rights reserved.
    `,
    description: 'Email template for teacher account blocking notifications',
    variables: ['teacherName', 'reason', 'blockedAt', 'adminName']
  },
  {
    templateName: 'teacher_unblocked',
    subject: 'Account Unblocked - IIPE LMS',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">IIPE LMS</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Account Unblocked</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{teacherName}},</h2>
          <p style="color: #666; margin-bottom: 20px;">
            Your IIPE LMS account has been unblocked by {{adminName}}.
          </p>
          
          <div style="background: white; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
            <h3 style="color: #28a745; margin: 0 0 10px 0;">Unblocking Details:</h3>
            <p style="margin: 5px 0;"><strong>Unblocked At:</strong> {{unblockedAt}}</p>
            <p style="margin: 5px 0;"><strong>Unblocked By:</strong> {{adminName}}</p>
          </div>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #155724; margin: 0;">
              <strong>Good News:</strong> You can now access your IIPE LMS account normally.
            </p>
          </div>
          
          <p style="color: #666; margin-top: 20px;">
            Welcome back! You can now log in and continue using your IIPE LMS account.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 IIPE LMS. All rights reserved.</p>
        </div>
      </div>
    `,
    bodyText: `
      IIPE LMS - Account Unblocked
      
      Hello {{teacherName}},
      
      Your IIPE LMS account has been unblocked by {{adminName}}.
      
      Unblocking Details:
      Unblocked At: {{unblockedAt}}
      Unblocked By: {{adminName}}
      
      Good News: You can now access your IIPE LMS account normally.
      
      Welcome back! You can now log in and continue using your IIPE LMS account.
      
      © 2024 IIPE LMS. All rights reserved.
    `,
    description: 'Email template for teacher account unblocking notifications',
    variables: ['teacherName', 'unblockedAt', 'adminName']
  }
];

// Migration function
const migrateTemplates = async () => {
  try {
    console.log('Starting email template migration...');
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const templateData of emailTemplates) {
      try {
        // Check if template already exists
        const existingTemplate = await EmailTemplate.findOne({ 
          templateName: templateData.templateName 
        });
        
        if (existingTemplate) {
          // Update existing template
          await EmailTemplate.findOneAndUpdate(
            { templateName: templateData.templateName },
            { 
              ...templateData,
              updatedAt: new Date()
            },
            { runValidators: true }
          );
          console.log(`✅ Updated template: ${templateData.templateName}`);
          updatedCount++;
        } else {
          // Create new template
          await EmailTemplate.create(templateData);
          console.log(`✅ Created template: ${templateData.templateName}`);
          createdCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing template ${templateData.templateName}:`, error.message);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Created: ${createdCount} templates`);
    console.log(`   Updated: ${updatedCount} templates`);
    console.log(`   Total processed: ${createdCount + updatedCount} templates`);
    
    // Verify all templates are in database
    const totalTemplates = await EmailTemplate.countDocuments({ isActive: true });
    console.log(`   Total active templates in database: ${totalTemplates}`);
    
    console.log('\n✅ Email template migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateTemplates();
}

module.exports = { migrateTemplates, emailTemplates };