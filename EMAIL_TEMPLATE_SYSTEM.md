# Email Template System - Database-Driven Templates

## 🎯 Overview

All email templates in the IIPE LMS system are now stored in the MongoDB database instead of being hardcoded in the codebase. This allows for dynamic template management, updates, and modifications without requiring code changes or deployments.

## ✅ Features Implemented

### 1. Database Storage
- **All templates stored in MongoDB** - No hardcoded templates in codebase
- **Dynamic template rendering** - Templates are fetched from database at runtime
- **Template versioning** - Track template changes with timestamps and user attribution
- **Soft deletion** - Templates can be deactivated without permanent deletion

### 2. Template Management
- **Admin-only access** - Only administrators can manage email templates
- **CRUD operations** - Create, Read, Update, Delete templates via API
- **Template preview** - Preview templates with sample data before saving
- **Variable support** - Templates support dynamic variables with placeholder replacement

### 3. Security Features
- **No fallback templates** - System fails securely if templates are missing from database
- **Admin authentication required** - All template management requires admin privileges
- **Audit trail** - Track who created/updated templates and when

## 🗄️ Database Schema

### EmailTemplate Collection
```javascript
{
  templateName: String,        // Unique identifier for the template
  subject: String,            // Email subject line
  bodyHtml: String,           // HTML email body
  bodyText: String,           // Plain text email body
  description: String,        // Template description
  variables: [String],        // Array of variable names used in template
  isActive: Boolean,          // Whether template is active
  createdBy: ObjectId,        // User who created the template
  updatedBy: ObjectId,        // User who last updated the template
  createdAt: Date,           // Creation timestamp
  updatedAt: Date            // Last update timestamp
}
```

## 📧 Available Templates

### 1. Email Verification Templates
- **`email_verification_signup`** - For user registration verification
- **`email_verification_login`** - For login verification

### 2. Concurrent Login Templates
- **`concurrent_login_alert`** - Security alert for concurrent login attempts

### 3. General Notification Templates
- **`notification`** - General notification emails
- **`task_assignment`** - Task assignment notifications
- **`task_submission`** - Task submission notifications
- **`auto_submission_notification`** - Auto-submission notifications

### 4. Authentication Templates
- **`password_reset`** - Password reset emails
- **`teacher_welcome`** - Welcome emails for new teachers
- **`teacher_blocked`** - Account blocking notifications
- **`teacher_unblocked`** - Account unblocking notifications

## 🔧 API Endpoints

### Get All Templates
```bash
GET /api/email-templates
Authorization: Bearer <admin_token>
```

### Get Specific Template
```bash
GET /api/email-templates/:templateName
Authorization: Bearer <admin_token>
```

### Create/Update Template
```bash
POST /api/email-templates
PUT /api/email-templates/:templateName
Authorization: Bearer <admin_token>

{
  "templateName": "template_name",
  "subject": "Email Subject - {{variable}}",
  "bodyHtml": "<html>Template with {{variables}}</html>",
  "bodyText": "Plain text template with {{variables}}",
  "description": "Template description",
  "variables": ["variable1", "variable2"]
}
```

### Preview Template
```bash
POST /api/email-templates/:templateName/preview
Authorization: Bearer <admin_token>

{
  "variables": {
    "variable1": "value1",
    "variable2": "value2"
  }
}
```

### Delete Template
```bash
DELETE /api/email-templates/:templateName
Authorization: Bearer <admin_token>
```

## 🎨 Template Variables

Templates use the `{{variableName}}` syntax for dynamic content replacement:

### Common Variables
- **`{{userName}}`** - User's name
- **`{{userEmail}}`** - User's email address
- **`{{otp}}`** - Verification code
- **`{{ipAddress}}`** - IP address
- **`{{userAgent}}`** - User agent string
- **`{{timestamp}}`** - Current timestamp
- **`{{title}}`** - Email title/subject
- **`{{message}}`** - Email message content

### Template-Specific Variables
- **Task Assignment**: `{{studentName}}`, `{{taskTitle}}`, `{{classroomName}}`, `{{teacherName}}`
- **Password Reset**: `{{resetLink}}`
- **Teacher Management**: `{{tempPassword}}`, `{{createdByName}}`, `{{reason}}`, `{{blockedAt}}`, `{{adminName}}`

## 🚀 Migration Process

### 1. Run Migration Script
```bash
cd server
node migrate-email-templates.js
```

This script will:
- Connect to MongoDB
- Create/update all email templates in the database
- Verify successful migration
- Display migration summary

### 2. Verify Templates
```bash
# Check that templates are in database
GET /api/email-templates
```

### 3. Test Template Rendering
```bash
# Test email verification with database templates
POST /api/email-verification/send-otp
{
  "email": "test@example.com",
  "purpose": "signup"
}
```

## 🛠️ Template Management Workflow

### 1. View Templates
```bash
# Get all templates
curl -H "Authorization: Bearer <admin_token>" \
     http://localhost:8000/api/email-templates
```

### 2. Edit Template
```bash
# Update template content
curl -X PUT \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "subject": "Updated Subject - {{userName}}",
       "bodyHtml": "<html>Updated template</html>",
       "bodyText": "Updated plain text",
       "description": "Updated description"
     }' \
     http://localhost:8000/api/email-templates/email_verification_signup
```

### 3. Preview Changes
```bash
# Preview template with sample data
curl -X POST \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "variables": {
         "userName": "John Doe",
         "otp": "1234"
       }
     }' \
     http://localhost:8000/api/email-templates/email_verification_signup/preview
```

### 4. Test Template
```bash
# Send test email using updated template
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "purpose": "signup"
     }' \
     http://localhost:8000/api/email-verification/send-otp
```

## 🔒 Security Considerations

### 1. Access Control
- **Admin-only access** - Only administrators can manage templates
- **Authentication required** - All template operations require valid admin token
- **Role-based permissions** - Template management restricted to admin role

### 2. Data Validation
- **Required fields validation** - All required template fields must be provided
- **Variable validation** - Variables must be properly formatted
- **HTML sanitization** - Template content is validated before storage

### 3. Error Handling
- **Graceful failures** - System fails securely if templates are missing
- **Detailed error messages** - Clear error messages for debugging
- **Audit logging** - All template operations are logged

## 📊 Monitoring and Maintenance

### 1. Template Health Checks
```bash
# Check template status
GET /api/email-templates
# Verify all required templates are present and active
```

### 2. Performance Monitoring
- Monitor template rendering performance
- Track email delivery success rates
- Monitor template usage statistics

### 3. Regular Maintenance
- Review and update templates periodically
- Clean up inactive templates
- Monitor template variable usage

## 🧪 Testing

### 1. Template System Tests
```bash
# Run comprehensive template tests
node tests/api/test_email_template_system.js
```

### 2. Email Verification Tests
```bash
# Test email verification with database templates
node tests/api/test_email_verification_and_concurrent_login.js
```

### 3. Manual Testing
- Create test templates
- Preview templates with sample data
- Send test emails
- Verify template rendering

## 🎯 Benefits

### 1. Dynamic Management
- **No code changes required** - Update templates without deployments
- **Real-time updates** - Changes take effect immediately
- **Version control** - Track template changes over time

### 2. Improved Security
- **Centralized control** - All templates managed from database
- **Access control** - Admin-only template management
- **Audit trail** - Complete history of template changes

### 3. Better User Experience
- **Consistent branding** - All templates follow same design patterns
- **Customizable content** - Easy to update email content
- **Professional appearance** - Beautiful HTML templates with proper styling

## 🚀 Future Enhancements

### 1. Template Editor UI
- Web-based template editor for admins
- WYSIWYG template editing
- Template preview functionality

### 2. Template Categories
- Organize templates by category
- Template inheritance
- Shared template components

### 3. Advanced Features
- A/B testing for templates
- Template analytics
- Multi-language support
- Template scheduling

---

**Email Template System Implementation Complete! 🎉**

All email templates are now stored in the database and can be managed dynamically without code changes. The system provides secure, efficient, and maintainable email template management with comprehensive API endpoints and testing capabilities.