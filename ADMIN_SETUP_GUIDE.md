# Admin Setup Guide

This guide will help you resolve the admin signup issue and set up admin access for your LMS system.

## Problem Identified

The admin signup was failing with a 403 Forbidden error because:
1. The `ADMIN_ACCESS_CODE` environment variable was not configured
2. The system requires this code for admin self-registration

## Quick Fix

### Option 1: Automated Setup (Recommended)

Run the setup script to automatically configure everything:

```bash
cd server
npm run setup
```

This will:
- Create a `.env` file with proper configuration
- Set up the admin access code (`ADMIN2024`)
- Create a default admin user (`admin@iipe.com` / `admin123`)

### Option 2: Manual Setup

1. **Create Environment File**
   Create a `.env` file in the `server` directory with:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/lms_4

   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Admin Access Code for self-registration
   ADMIN_ACCESS_CODE=ADMIN2024

   # Server Port
   PORT=8000
   ```

2. **Create Admin User**
   ```bash
   cd server
   npm run create-admin
   ```

## How Admin Registration Works

### For Self-Registration (Public)
1. Users can register as admin through the registration form
2. They must provide the correct `ADMIN_ACCESS_CODE` (default: `ADMIN2024`)
3. The system validates the code before creating the admin account

### For System-Generated Admin
1. Use the setup script to create a default admin
2. Login with: `admin@iipe.com` / `admin123`
3. Change password on first login

## Testing Admin Registration

1. **Start the server:**
   ```bash
   cd server
   npm start
   ```

2. **Test admin registration:**
   - Go to the registration page
   - Select "Admin" as role
   - Enter the access code: `ADMIN2024`
   - Complete the registration form

3. **Test admin login:**
   - Use the created admin credentials
   - Access the admin dashboard

## Security Notes

- **Change the default admin password** after first login
- **Modify the ADMIN_ACCESS_CODE** in production (update in `.env` file)
- **Use a strong JWT_SECRET** in production
- **Consider disabling admin self-registration** in production by removing the admin option from the registration form

## Troubleshooting

### Still getting 403 error?
1. Check if `.env` file exists in `server` directory
2. Verify `ADMIN_ACCESS_CODE` is set in the `.env` file
3. Restart the server after creating the `.env` file
4. Check server logs for specific error messages

### Admin user not created?
1. Ensure MongoDB is running
2. Check database connection in `.env` file
3. Run `npm run create-admin` manually
4. Check for existing admin users in the database

## File Changes Made

1. **Enhanced error handling** in `authController.js` for better error messages
2. **Created setup scripts** for easy configuration
3. **Added npm scripts** for admin management
4. **Improved admin creation** with better logging

## Next Steps

After successful setup:
1. Test admin registration and login
2. Create additional admin users if needed
3. Configure email settings (optional)
4. Set up proper production environment variables
