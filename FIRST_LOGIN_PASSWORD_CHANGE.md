# First Login Password Change Feature

## Overview

This feature implements a mandatory password change requirement for students on their first login. This is a security best practice that ensures users don't continue using default or temporary passwords.

## Features Implemented

### 1. Database Schema Updates
- Added `isFirstLogin` field to User model (default: true)
- Added `createdBy` field to track who created the user
- Added `updatedBy` field to track who last updated the user
- Enhanced `passwordChangeHistory` to include `changedBy` field

### 2. Backend API Changes
- New endpoint: `POST /api/auth/change-password-first-login`
- Updated login response to include `isFirstLogin` status
- Enhanced password reset to track `updatedBy`
- Admin user creation now sets audit fields

### 3. Frontend Changes
- New component: `FirstLoginPasswordChange.jsx`
- Updated routing to redirect first-time students
- Enhanced auth state management
- Automatic redirects for first-time users

## How It Works

### For New Students
1. Student registers with email/password
2. On first login, they are redirected to password change page
3. Must change password before accessing dashboard
4. After password change, `isFirstLogin` is set to false
5. Normal access to student features is granted

### For Existing Students
- Existing users will have `isFirstLogin` set to false after migration
- No password change required

### For Teachers and Admins
- Teachers created by admins will have `isFirstLogin` set to true
- Admins are not affected by this feature

## Database Migration

Before running the application, you must run the migration script to update existing users:

```bash
cd server
node migrate-users.js
```

This script will:
- Set `isFirstLogin: false` for all existing users
- Set `createdBy: null` and `updatedBy: null` for existing users
- Update existing password change history entries

## API Endpoints

### Change Password on First Login
```
POST /api/auth/change-password-first-login
Authorization: Bearer <token>
Body: {
  "currentPassword": "current_password",
  "newPassword": "new_password"
}
```

### Updated Login Response
```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "student",
    "isFirstLogin": true
  }
}
```

## Security Features

1. **Password Validation**: New password must be at least 6 characters
2. **Current Password Verification**: Must verify current password before changing
3. **One-Time Only**: Password change is only required on first login
4. **Audit Trail**: All password changes are tracked with timestamps and user IDs
5. **Role-Based**: Only affects students (teachers and admins are exempt)

## User Experience

### First-Time Student Flow
1. Login → Redirected to password change page
2. Enter current password + new password + confirm
3. Submit → Password updated, redirected to dashboard
4. Future logins → Normal dashboard access

### Error Handling
- Invalid current password → Error message
- Password mismatch → Error message
- Weak password → Error message
- Network errors → Proper error display

## Configuration

The feature is enabled by default and cannot be disabled. To modify behavior:

1. **Change minimum password length**: Update validation in `FirstLoginPasswordChange.jsx`
2. **Modify redirect behavior**: Update routing logic in `App.jsx`
3. **Customize UI**: Modify `FirstLoginPasswordChange.jsx` component

## Testing

### Test Scenarios
1. **New student registration**: Should set `isFirstLogin: true`
2. **First login**: Should redirect to password change
3. **Password change**: Should update database and redirect to dashboard
4. **Subsequent logins**: Should go directly to dashboard
5. **Existing users**: Should not be affected after migration

### Test Commands
```bash
# Run migration
cd server && node migrate-users.js

# Test new student registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"test@example.com","password":"password123","role":"student"}'

# Test first login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Troubleshooting

### Common Issues

1. **Migration fails**: Check MongoDB connection and permissions
2. **Users stuck on password change**: Verify `isFirstLogin` field in database
3. **Routing loops**: Check redirect logic in `App.jsx`
4. **API errors**: Verify endpoint exists and authentication middleware

### Debug Steps

1. Check user document in MongoDB:
```javascript
db.users.findOne({email: "user@example.com"})
```

2. Verify `isFirstLogin` field value
3. Check browser console for routing errors
4. Verify API endpoint responses

## Future Enhancements

1. **Password Policy**: Configurable password strength requirements
2. **Admin Override**: Allow admins to force password changes
3. **Expiration**: Set password change deadlines
4. **Notifications**: Email reminders for password changes
5. **Analytics**: Track password change compliance rates
