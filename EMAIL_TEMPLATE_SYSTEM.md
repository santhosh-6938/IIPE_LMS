# Dynamic Email Template System

## Overview

The IIPE LMS now features a dynamic email template system that allows administrators to manage email templates directly from the database without requiring code changes. All email templates have been moved from hardcoded strings to a database-driven system with fallback support.

## Features

- **Database-driven templates**: All email templates stored in MongoDB only
- **Dynamic variable replacement**: Support for `{{variable}}` placeholders
- **Security-first design**: No hardcoded templates - all content in database
- **Admin-only access**: Strict access control for template management
- **Template preview**: Test templates with sample data
- **Version control**: Track template changes with timestamps and user attribution
- **Security alerts**: Proper error handling and logging for missing templates

## Database Schema

### EmailTemplate Model

```javascript
{
  templateName: String,        // Unique identifier (e.g., 'notification')
  subject: String,            // Email subject with placeholders
  bodyHtml: String,           // HTML email body with placeholders
  bodyText: String,           // Plain text email body with placeholders
  description: String,        // Human-readable description
  variables: [String],        // List of expected variables
  isActive: Boolean,          // Soft delete flag
  createdBy: ObjectId,        // User who created the template
  updatedBy: ObjectId,        // User who last updated the template
  createdAt: Date,           // Creation timestamp
  updatedAt: Date            // Last update timestamp
}
```

## Available Templates

### 1. Notification Template (`notification`)
- **Purpose**: General system notifications
- **Variables**: `userName`, `title`, `message`
- **Usage**: User notifications, system alerts

### 2. Task Assignment Template (`task_assignment`)
- **Purpose**: Notify students of new task assignments
- **Variables**: `studentName`, `taskTitle`, `classroomName`, `teacherName`
- **Usage**: When teachers assign new tasks

### 3. Task Submission Template (`task_submission`)
- **Purpose**: Notify teachers of task submissions
- **Variables**: `teacherName`, `studentName`, `taskTitle`, `isAutoSubmission*`
- **Usage**: When students submit tasks (manual or auto-submission)

### 4. Auto-submission Notification Template (`auto_submission_notification`)
- **Purpose**: Notify students of auto-submitted tasks
- **Variables**: `studentName`, `taskTitle`, `classroomName`
- **Usage**: When system auto-submits draft tasks

### 5. Password Reset Template (`password_reset`)
- **Purpose**: Password reset instructions with OTP
- **Variables**: `userName`, `otp`, `resetLink`
- **Usage**: Password reset flow

### 6. Teacher Welcome Template (`teacher_welcome`)
- **Purpose**: Welcome new teachers created by admin
- **Variables**: `teacherName`, `teacherEmail`, `tempPassword`, `createdByName`
- **Usage**: When admin creates teacher accounts

## API Endpoints

### Get All Templates
```
GET /api/email-templates
Authorization: Bearer <admin_token>
```

### Get Specific Template
```
GET /api/email-templates/:templateName
Authorization: Bearer <admin_token>
```

### Create/Update Template
```
POST /api/email-templates
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "templateName": "notification",
  "subject": "New Notification: {{title}}",
  "bodyHtml": "<div>Hello {{userName}}...</div>",
  "bodyText": "Hello {{userName}}...",
  "description": "General notification template",
  "variables": ["userName", "title", "message"]
}
```

### Update Template
```
PUT /api/email-templates/:templateName
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "subject": "Updated Subject: {{title}}",
  "bodyHtml": "<div>Updated HTML...</div>",
  "bodyText": "Updated text..."
}
```

### Delete Template (Soft Delete)
```
DELETE /api/email-templates/:templateName
Authorization: Bearer <admin_token>
```

### Preview Template
```
POST /api/email-templates/:templateName/preview
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "variables": {
    "userName": "John Doe",
    "title": "Test Notification"
  }
}
```

## Setup Instructions

### 1. Run Migration Script
```bash
cd server
node migrate-email-templates.js
```

This will:
- Create the EmailTemplate model in MongoDB
- Populate initial templates from hardcoded defaults
- Set up proper indexes for performance

### 2. Test the System
```bash
cd server
node test-email-templates.js
node test-email-template-security.js
```

This will:
- Test all template rendering
- Verify security implementation
- Check placeholder replacement
- Validate admin-only access

### 3. Verify Email Service
The existing email service has been updated to use the new template system. No changes are needed in existing code - all email functions will automatically use database templates.

## Template Variable System

### Placeholder Format
Use double curly braces for variable placeholders:
```
Hello {{userName}}, you have a new {{title}}.
```

### Variable Replacement
The system automatically replaces placeholders with provided values:
```javascript
const variables = {
  userName: 'John Doe',
  title: 'Assignment'
};
// Result: "Hello John Doe, you have a new Assignment."
```

### Security-First Behavior
- **No hardcoded fallbacks**: All templates must exist in database
- **Security alerts**: Missing templates trigger security alerts and errors
- **Admin-only access**: Only administrators can create, read, update, or delete templates
- **Audit logging**: All template access is logged for security monitoring

## Admin Interface Integration

The template system is designed to integrate with admin interfaces. Admins can:

1. **View all templates** with descriptions and variable lists
2. **Edit templates** with a rich text editor for HTML content
3. **Preview templates** with sample data before saving
4. **Test templates** to ensure proper rendering
5. **Track changes** with user attribution and timestamps

## Migration from Hardcoded Templates

The migration ensures complete security:
- All existing email functions continue to work
- Templates are migrated to the database and removed from codebase
- No hardcoded templates remain in the code for security
- All template content is now admin-controlled via database
- Security alerts ensure proper template management

## Best Practices

### Template Design
1. **Use semantic variable names**: `userName` instead of `u`
2. **Include both HTML and text versions**: Better email client compatibility
3. **Test with sample data**: Use the preview endpoint
4. **Document variables**: Include in template description

### Variable Management
1. **Consistent naming**: Use camelCase for all variables
2. **Required variables**: Document which variables are mandatory
3. **Default values**: Handle missing variables gracefully
4. **Validation**: Validate template syntax before saving

### Performance
1. **Template caching**: Templates are cached in memory for performance
2. **Database indexes**: Proper indexing on templateName and isActive
3. **Fallback efficiency**: Minimal overhead when using fallbacks

## Troubleshooting

### Common Issues

1. **Template not found**: Check templateName spelling and isActive status
2. **Placeholders not replaced**: Verify variable names match exactly
3. **Email not sending**: Check email service configuration
4. **Database connection**: Ensure MongoDB is running and accessible

### Debug Mode
Enable detailed logging by setting:
```javascript
process.env.EMAIL_TEMPLATE_DEBUG = 'true'
```

### Logs to Monitor
- Template fallback warnings
- Variable replacement errors
- Database connection issues
- Email sending failures

## Future Enhancements

1. **Template versioning**: Track template history and rollback
2. **A/B testing**: Test different template versions
3. **Conditional logic**: Support for if/else in templates
4. **Rich editor**: WYSIWYG template editor
5. **Template categories**: Organize templates by type
6. **Bulk operations**: Import/export multiple templates
7. **Template analytics**: Track email open rates and engagement

## Security Considerations

1. **Admin-only access**: Template management restricted to admin users
2. **Input validation**: Sanitize HTML content to prevent XSS
3. **Variable escaping**: Properly escape user-provided variables
4. **Audit trail**: Track all template changes for security
5. **Access control**: Role-based permissions for template management

This dynamic email template system provides a robust, scalable solution for managing email communications in the IIPE LMS platform.
