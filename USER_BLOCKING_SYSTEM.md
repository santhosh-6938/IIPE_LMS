# User Account Blocking System

## Overview

The IIPE LMS now includes a comprehensive user account blocking system that allows administrators to block teacher accounts (and other user roles) when they leave the institution, preventing misuse of their access while preserving their data.

## Features

- **Account Blocking**: Block/unblock user accounts with a simple database flag
- **Role-Based Blocking**: Block teachers, students, or any user role
- **Admin Protection**: Prevent blocking of other admin accounts
- **Audit Trail**: Complete logging of block/unblock actions
- **Bulk Operations**: Block multiple users at once
- **Detailed Tracking**: Track who blocked whom, when, and why
- **Authentication Integration**: Blocked users cannot login or access APIs
- **Data Preservation**: Blocked users' data remains intact

## Database Schema

### User Model Updates

New fields added to the User model:

```javascript
{
  // Account blocking status
  isBlocked: {
    type: Boolean,
    default: false
  },
  // Blocking details
  blockedAt: {
    type: Date,
    default: null
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  blockedReason: {
    type: String,
    default: null,
    trim: true
  }
}
```

### Database Indexes

```javascript
userSchema.index({ isBlocked: 1 });
userSchema.index({ isActive: 1, isBlocked: 1 });
```

## API Endpoints

### Block User Account
```
POST /api/user-blocking/block/:userId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Teacher left the institution"
}
```

### Unblock User Account
```
POST /api/user-blocking/unblock/:userId
Authorization: Bearer <admin_token>
```

### Get Blocked Users List
```
GET /api/user-blocking/blocked?page=1&limit=10&role=teacher
Authorization: Bearer <admin_token>
```

### Get User Blocking Status
```
GET /api/user-blocking/status/:userId
Authorization: Bearer <admin_token>
```

### Bulk Block Users
```
POST /api/user-blocking/bulk-block
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userIds": ["userId1", "userId2", "userId3"],
  "reason": "Bulk blocking - department restructuring"
}
```

## Authentication Integration

### Login Blocking
When a blocked user attempts to login:

```json
{
  "message": "Your account has been blocked. Please contact admin.",
  "code": "ACCOUNT_BLOCKED"
}
```

### API Access Blocking
When a blocked user attempts to access protected APIs:

```json
{
  "message": "Your account has been blocked. Please contact admin.",
  "code": "ACCOUNT_BLOCKED"
}
```

### Middleware Integration
The authentication middleware automatically checks:
1. **Token validity**
2. **User existence**
3. **Account blocking status** ← New
4. **Account active status**

## Security Features

### Admin Protection
- **Self-blocking prevention**: Admins cannot block their own accounts
- **Admin protection**: Admins cannot block other admin accounts
- **Role-based restrictions**: Only admins can block/unblock users

### Audit Logging
All blocking actions are logged with:
- **Action type**: `user.block`, `user.unblock`, `user.bulk_block`
- **Target user**: User being blocked/unblocked
- **Admin user**: Who performed the action
- **Timestamp**: When the action occurred
- **Reason**: Why the user was blocked

### Data Integrity
- **No data deletion**: Blocked users' data remains intact
- **Reversible actions**: Users can be unblocked at any time
- **Historical tracking**: Complete audit trail of blocking actions

## Setup Instructions

### 1. Run Migration Script
```bash
cd server
node migrate-user-blocking.js
```

This will:
- Add blocking fields to existing users
- Set default values (isBlocked: false)
- Verify migration completion

### 2. Test the System
```bash
cd server
node test-user-blocking.js
```

This will:
- Test blocking field presence
- Test blocking/unblocking functionality
- Verify statistics and validation

### 3. Verify Integration
The blocking system is automatically integrated with:
- **Authentication middleware**: Blocks API access
- **Login controller**: Blocks login attempts
- **Activity logging**: Tracks all blocking actions

## Usage Examples

### Block a Teacher
```bash
curl -X POST \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Teacher left the institution"}' \
  http://localhost:8000/api/user-blocking/block/64a1b2c3d4e5f6789abcdef0
```

### Get Blocked Teachers
```bash
curl -H "Authorization: Bearer <admin_token>" \
  "http://localhost:8000/api/user-blocking/blocked?role=teacher&page=1&limit=10"
```

### Unblock a User
```bash
curl -X POST \
  -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/user-blocking/unblock/64a1b2c3d4e5f6789abcdef0
```

### Bulk Block Users
```bash
curl -X POST \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["64a1b2c3d4e5f6789abcdef0", "64a1b2c3d4e5f6789abcdef1"],
    "reason": "Department restructuring"
  }' \
  http://localhost:8000/api/user-blocking/bulk-block
```

## Response Examples

### Successful Block
```json
{
  "success": true,
  "message": "User account blocked successfully",
  "data": {
    "userId": "64a1b2c3d4e5f6789abcdef0",
    "email": "teacher@example.com",
    "role": "teacher",
    "isBlocked": true,
    "blockedAt": "2024-01-15T10:30:00.000Z",
    "blockedReason": "Teacher left the institution"
  }
}
```

### Blocked Users List
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "64a1b2c3d4e5f6789abcdef0",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "teacher",
        "blockedAt": "2024-01-15T10:30:00.000Z",
        "blockedReason": "Teacher left the institution",
        "blockedBy": {
          "_id": "64a1b2c3d4e5f6789abcdef1",
          "name": "Admin User",
          "email": "admin@example.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalUsers": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

## Error Handling

### User Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### Already Blocked
```json
{
  "success": false,
  "error": "User account is already blocked"
}
```

### Cannot Block Admin
```json
{
  "success": false,
  "error": "Cannot block other admin accounts"
}
```

### Cannot Block Self
```json
{
  "success": false,
  "error": "Cannot block your own account"
}
```

## Admin Interface Integration

The blocking system is designed for easy integration with admin interfaces:

### Features for Admin UI
1. **User Management**: Add block/unblock buttons to user lists
2. **Bulk Operations**: Select multiple users for bulk blocking
3. **Status Indicators**: Show blocked status in user cards
4. **Audit Trail**: Display blocking history and reasons
5. **Statistics Dashboard**: Show blocked user counts by role

### UI Components Needed
- Block/Unblock buttons
- Blocking reason input field
- Blocked user status indicators
- Bulk selection checkboxes
- Blocking history timeline
- User statistics charts

## Best Practices

### Blocking Reasons
Use clear, professional reasons:
- "Teacher left the institution"
- "Account suspended for policy violation"
- "Temporary suspension pending investigation"
- "Department restructuring"

### Regular Audits
- Review blocked users monthly
- Unblock users when appropriate
- Maintain audit trail for compliance
- Monitor blocking patterns

### Communication
- Notify users before blocking (if possible)
- Provide clear unblocking procedures
- Document blocking policies
- Train admins on proper usage

## Security Considerations

### Access Control
- Only admins can block/unblock users
- Admins cannot block other admins
- Self-blocking is prevented
- All actions are logged

### Data Protection
- Blocked users' data is preserved
- No data deletion occurs
- Historical records maintained
- Reversible operations only

### Audit Compliance
- Complete action logging
- User attribution tracking
- Timestamp recording
- Reason documentation

## Future Enhancements

### Planned Features
1. **Temporary Blocking**: Set expiration dates for blocks
2. **Role-Specific Blocking**: Different blocking rules per role
3. **Notification System**: Email notifications for blocking actions
4. **Blocking Templates**: Predefined blocking reasons
5. **Analytics Dashboard**: Blocking statistics and trends
6. **API Rate Limiting**: Additional protection for blocked users
7. **Integration Hooks**: Webhooks for external system integration

### Extensibility
The system is designed to be easily extensible:
- Add new blocking reasons
- Implement role-specific rules
- Integrate with external systems
- Add custom validation logic
- Extend audit logging

This user blocking system provides a secure, auditable, and user-friendly way to manage user access in the IIPE LMS platform.
