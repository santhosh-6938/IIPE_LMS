## Platform Features by Role

This document summarizes key features available to each role in the platform: Admin, Teacher, and Student.

### Admin
- **Authentication**: Register/Login, first-login password change, secure JWT sessions.
- **Dashboard**:
  - Overall statistics (users, classrooms, tasks, active users).
  - Recent users and recent classrooms overview.
- **User Management**:
  - List/search/filter users by role.
  - Create Teacher accounts (with optional auto-generated password and welcome email if email service is configured).
  - Edit user details (name, email, role, roll number, active status).
  - Delete users (with safeguards against deleting self or other admins if not admin).
- **Teacher Attendance Management**:
  - Daily teacher attendance view (present/absent totals, status per teacher).
  - Attendance history and statistics.
  - Export/download attendance reports.
- **Notifications**:
  - System can send notifications to users (e.g., when added to a classroom).
- **Security & Governance**:
  - First-login password change enforcement (for staff/student roles).
  - Password reuse protection (checks against last 3 passwords).
  - Activity logging hooks in authentication flows.

### Teacher
- **Authentication**: Login via email, first-login password change enforcement, secure JWT sessions.
- **Dashboard**:
  - Overview of classrooms, tasks, and notifications.
  - Quick navigation to manage content and assignments.
- **Classroom Management**:
  - Create and manage classrooms.
  - View enrolled students (name, email, roll number).
  - Add/remove students individually.
  - Bulk import students via Excel/CSV (requires columns: name, email, rollnumber).
  - Automatic notification/email to students when added (if email configured).
- **Task/Assignment Management**:
  - Create, edit, and view tasks/assignments.
  - Track submissions, drafts, and status per student.
- **Course Content Management**:
  - Upload and manage course materials for classrooms.
- **Attendance Management (Students)**:
  - Load daily attendance for a classroom.
  - Mark students present/absent with notes.
  - Freeze/unfreeze attendance for a specific date.
  - View attendance history and statistics; export reports.
- **Code Compiler & Submissions**:
  - Access compiler and view student code history for evaluation.
- **Notifications**:
  - Students receive notifications when added to classrooms; teachers can view related activity.

### Student
- **Authentication**: Register/Login via email or roll number, first-login password change, secure JWT sessions.
- **Dashboard**:
  - Personalized overview: classrooms, tasks (pending/due soon/overdue/completed), notifications.
- **Classrooms**:
  - View enrolled classrooms and classroom details.
  - Access course content and announcements.
- **Tasks & Submissions**:
  - View assigned tasks with deadlines and status.
  - Submit solutions; see submission status (submitted/draft).
  - View task details and history of submissions.
- **Attendance (Self View)**:
  - View personal attendance summary and detailed history per classroom.
- **Compiler**:
  - Use integrated code compiler.
  - View personal code execution history.
- **Notifications**:
  - Receive notifications when added to classrooms and for other key events.

### Shared/Platform-Wide
- **Security**:
  - Passwords stored with bcrypt hashing; pre-save hashing enforced server-side.
  - First-login password change flow with prevention of reusing last 3 passwords.
  - JWT-based auth with role checks and protected routes.
- **User Profile Fields**:
  - Name, email, role; roll number required for students (unique, case-insensitive stored uppercase).
- **Activity & Audit**:
  - Activity logging hooks during auth events.
- **Performance & UX**:
  - Role-aware dashboards and guarded routes.
  - Inline validations (e.g., password length, student roll number in registration).

### Notes for Demonstration
- To showcase student login, you can authenticate using either email or roll number along with the password.
- On first login (student/teacher), the system requires a password change and prevents reusing any of the last three passwords.
- Teachers can import students in bulk using an Excel/CSV with headers: name, email, rollnumber.
- Admin can create teacher accounts and optionally email credentials if email settings are configured.


