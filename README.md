# Education Platform

A comprehensive education platform built with React, Node.js, and MongoDB that supports role-based access control (RBAC) for teachers and students, plus a **standalone code compiler** accessible without login.

## Features

### For Teachers
- **Dashboard**: Overview of classrooms, students, and tasks
- **Classroom Management**: Create and manage virtual classrooms
- **Student Management**: Add/remove students from classrooms
- **Course Content**: Upload and manage course materials (videos, documents, images, audio)
- **Task Management**: Create and assign tasks to students
- **Notifications**: Real-time notifications for classroom activities
- **Join Token System**: Generate and share join tokens for students

### For Students
- **Dashboard**: Overview of enrolled classes and pending tasks
- **Course Materials**: View and download course content
- **Task Submission**: Submit assignments and track progress
- **Notifications**: Receive notifications for new content and tasks
- **Classroom Overview**: View classmates and teacher information
- **First Login Security**: Mandatory password change on first login for enhanced security

### General Features
- **Authentication**: Secure login/register system with JWT
- **Role-Based Access**: Different interfaces for teachers and students
- **Email Notifications**: Automated email notifications for important events
- **File Upload**: Support for various file types (videos, documents, images, audio)
- **Responsive Design**: Modern UI that works on all devices
- **Audit Trail**: Complete tracking of user creation, updates, and password changes

## 🚀 **NEW: Code Compiler (No Login Required)**

### **Standalone Coding Compiler**
- **8+ Programming Languages**: JavaScript, Python, C++, C, Java, PHP, Ruby, Go
- **Real-time Execution**: Instant compilation and running
- **Input/Output Support**: Provide input to programs
- **Code Download**: Save code with proper file extensions
- **No Registration**: Start coding immediately
- **No Data Storage**: Complete privacy protection
- **Custom Built**: No external APIs, built entirely in-house

### **Access the Compiler**
- **Landing Page**: `/` - Beautiful introduction page
- **Compiler Interface**: `/compiler` - Full coding environment
- **No Authentication Required**: Public access for all users

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- **First-time password change requirement for students**
- File upload validation
- CORS protection
- Input validation and sanitization
- **Complete audit trail (createdBy, updatedBy, createdAt, updatedAt)**
- **Code execution security and sandboxing**

## Tech Stack

### Frontend
- React 18
- Redux Toolkit (State Management)
- React Router (Routing)
- Tailwind CSS (Styling)
- Lucide React (Icons)
- Axios (HTTP Client)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer (File Upload)
- Nodemailer (Email Service)
- bcryptjs (Password Hashing)
- **Custom Compiler Service** (Child Process Execution)

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
- **System Compilers**: Python, GCC, Java JDK, PHP, Ruby, Go

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd project
```

### 2. Install dependencies

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd client
npm install
```

### 3. Environment Setup

#### Backend Environment Variables
Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/rbac-education

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Gmail)
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**Note**: For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `MAIL_PASS`

#### Frontend Environment Variables
Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
mongod
```

### 5. Database Migration (IMPORTANT)
Before running the application for the first time, run the migration script to update existing users:

```bash
cd server
node migrate-users.js
```

This script will:
- Set `isFirstLogin: false` for all existing users
- Add audit fields (`createdBy`, `updatedBy`) to existing users
- Update password change history entries

### 6. Install System Compilers (For Code Compiler)
Ensure the following compilers are installed on your system:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3 gcc g++ openjdk-11-jdk php ruby golang-go

# macOS
brew install python gcc java php ruby go

# Windows
# Install individual compilers from their official websites
```

### 7. Run the application

#### Backend
```bash
cd server
npm run dev
```

#### Frontend
```bash
cd client
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Code Compiler**: http://localhost:5173/compiler

## New Features: First Login Password Change

### Overview
Students are now required to change their password on their first login. This enhances security by ensuring users don't continue using default or temporary passwords.

### How It Works
1. **New Students**: On first login, redirected to password change page
2. **Existing Students**: No password change required (after migration)
3. **Teachers/Admins**: Not affected by this feature
4. **One-Time Only**: Password change is only required once

### Testing the Feature
Run the test script to verify functionality:
```bash
cd tests/api
node test_first_login.js
```

For detailed documentation, see [FIRST_LOGIN_PASSWORD_CHANGE.md](FIRST_LOGIN_PASSWORD_CHANGE.md)

## 🧪 **Code Compiler Testing**

### Test the Compiler
```bash
# Test JavaScript execution
curl -X POST http://localhost:3001/api/compiler/run \
  -H "Content-Type: application/json" \
  -d '{"language":"javascript","code":"console.log(\"Hello World\")"}'

# Test Python execution
curl -X POST http://localhost:3001/api/compiler/run \
  -H "Content-Type: application/json" \
  -d '{"language":"python","code":"print(\"Hello World\")"}'

# Check compiler health
curl http://localhost:3001/api/compiler/health
```

### Compiler Documentation
For comprehensive compiler documentation, see [CODE_COMPILER_DOCUMENTATION.md](CODE_COMPILER_DOCUMENTATION.md)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password-first-login` - Change password on first login (NEW)
- `POST /api/auth/forgot` - Forgot password
- `POST /api/auth/reset` - Reset password

### Code Compiler (NEW - No Auth Required)
- `GET /api/compiler/languages` - Get supported programming languages
- `POST /api/compiler/run` - Compile and execute code
- `POST /api/compiler/download` - Download code as file
- `GET /api/compiler/templates/:language` - Get code templates
- `GET /api/compiler/health` - Compiler service health check

### Classrooms
- `GET /api/classrooms` - Get user's classrooms
- `POST /api/classrooms` - Create classroom (teacher only)
- `GET /api/classrooms/:id` - Get classroom details
- `PUT /api/classrooms/:id` - Update classroom (teacher only)
- `DELETE /api/classrooms/:id` - Delete classroom (teacher only)
- `POST /api/classrooms/join` - Join classroom with token (student only)
- `GET /api/classrooms/students/available` - Get available students (teacher only)
- `POST /api/classrooms/:classroomId/students` - Add students to classroom (teacher only)
- `DELETE /api/classrooms/:classroomId/students/:studentId` - Remove student from classroom (teacher only)

### Course Content
- `GET /api/course-content/classroom/:classroomId` - Get classroom content
- `POST /api/course-content/upload/:classroomId` - Upload content (teacher only)
- `PUT /api/course-content/:contentId` - Update content (teacher only)
- `DELETE /api/course-content/:contentId` - Delete content (teacher only)
- `GET /api/course-content/file/:filename` - Download file

### Tasks
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create task (teacher only)
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task (teacher only)
- `DELETE /api/tasks/:id` - Delete task (teacher only)
- `POST /api/tasks/:id/submit` - Submit task (student only)

### Notifications
- `GET /api/notifications` - Get user's notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

## File Upload Support

The platform supports the following file types:

### Documents
- PDF files
- Word documents (.doc, .docx)
- Excel files (.xls, .xlsx)
- Text files (.txt)
- CSV files

### Media
- Images (JPEG, PNG, GIF, WebP)
- Videos (MP4, WebM, OGG)
- Audio (MP3, WAV, OGG)

### File Size Limits
- Maximum file size: 100MB per file

## Usage

### For Teachers

1. **Register/Login**: Create an account with teacher role
2. **Create Classroom**: Set up a new virtual classroom
3. **Add Students**: Either share the join token or manually add students
4. **Upload Content**: Add course materials (videos, documents, etc.)
5. **Create Tasks**: Assign homework and assignments
6. **Monitor Progress**: Track student submissions and performance

### For Students

1. **Register/Login**: Create an account with student role
2. **First Login**: **Change password when prompted** (NEW SECURITY FEATURE)
3. **Join Classroom**: Use the join token provided by your teacher
4. **Access Materials**: View and download course content
5. **Submit Tasks**: Complete and submit assignments
6. **Track Progress**: Monitor your task completion status

### For Everyone (No Login Required)

1. **Visit Landing Page**: Go to `/` to see compiler features
2. **Start Coding**: Navigate to `/compiler` to begin coding
3. **Choose Language**: Select from 8+ programming languages
4. **Write Code**: Use the code editor with syntax support
5. **Run Code**: Execute code with real-time output
6. **Download**: Save your code with proper file extensions

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- **First-time password change requirement for students**
- File upload validation
- CORS protection
- Input validation and sanitization
- **Complete audit trail (createdBy, updatedBy, createdAt, updatedAt)**
- **Code execution security and sandboxing**
- **No data storage for compiler users**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
