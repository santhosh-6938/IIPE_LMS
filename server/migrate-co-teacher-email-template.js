const mongoose = require('mongoose');
const EmailTemplate = require('./models/EmailTemplate');
require('dotenv').config();

async function migrateCoTeacherEmailTemplate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if template already exists
    const existingTemplate = await EmailTemplate.findOne({ templateName: 'co_teacher_invitation' });
    
    if (existingTemplate) {
      console.log('Co-teacher invitation email template already exists');
      return;
    }

    // Create co-teacher invitation email template
    const coTeacherInvitationTemplate = new EmailTemplate({
      templateName: 'co_teacher_invitation',
      subject: 'Invitation to Collaborate as Co-Teacher - {{classroomName}}',
      bodyHtml: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Co-Teacher Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .classroom-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4CAF50; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Co-Teacher Invitation</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p><strong>{{mainTeacherName}}</strong> has invited you to collaborate as a co-teacher for the classroom:</p>
              
              <div class="classroom-info">
                <h3>{{classroomName}}</h3>
                <p><strong>Subject:</strong> {{classroomSubject}}</p>
                <p><strong>Description:</strong> {{classroomDescription}}</p>
              </div>
              
              <p>{{invitationMessage}}</p>
              
              <p>As a co-teacher, you will have full access to all classroom features including:</p>
              <ul>
                <li>Managing students and attendance</li>
                <li>Creating and grading assignments</li>
                <li>Uploading course materials</li>
                <li>Viewing and managing classroom activities</li>
              </ul>
              
              <p>To accept this invitation, please click the button below:</p>
              <a href="{{invitationUrl}}" class="button">Accept Invitation</a>
              
              <p><strong>Important:</strong> This invitation will expire in {{expiresIn}}. If you don't want to accept this invitation, you can simply ignore this email.</p>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;">{{invitationUrl}}</p>
            </div>
            <div class="footer">
              <p>This invitation was sent from the IIPE Learning Management System.</p>
              <p>If you believe this email was sent in error, please contact the system administrator.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      bodyText: `
        Co-Teacher Invitation
        
        Hello!
        
        {{mainTeacherName}} has invited you to collaborate as a co-teacher for the classroom: {{classroomName}}
        
        Classroom Details:
        - Subject: {{classroomSubject}}
        - Description: {{classroomDescription}}
        
        {{invitationMessage}}
        
        As a co-teacher, you will have full access to all classroom features including:
        - Managing students and attendance
        - Creating and grading assignments
        - Uploading course materials
        - Viewing and managing classroom activities
        
        To accept this invitation, please visit: {{invitationUrl}}
        
        Important: This invitation will expire in {{expiresIn}}. If you don't want to accept this invitation, you can simply ignore this email.
        
        This invitation was sent from the IIPE Learning Management System.
        If you believe this email was sent in error, please contact the system administrator.
      `,
      variables: [
        'mainTeacherName',
        'classroomName', 
        'classroomSubject',
        'classroomDescription',
        'invitationMessage',
        'invitationUrl',
        'expiresIn'
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await coTeacherInvitationTemplate.save();
    console.log('Co-teacher invitation email template created successfully');

  } catch (error) {
    console.error('Error creating co-teacher invitation email template:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCoTeacherEmailTemplate()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateCoTeacherEmailTemplate;
