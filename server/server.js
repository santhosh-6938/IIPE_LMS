const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// Remove static uploads middleware - we'll serve files through API routes
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/course-content', require('./routes/courseContent'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/admin/teacher-attendance', require('./routes/adminTeacherAttendance'));
app.use('/api/compiler', require('./routes/compiler'));
app.use('/api/judge', require('./routes/judge'));
app.use('/api/auto-submission', require('./routes/autoSubmission'));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Auto-submission cron job setup
const autoSubmissionService = require('./services/autoSubmissionService');

// Schedule auto-submission to run every minute
// This ensures submissions are processed close to the deadline
cron.schedule('* * * * *', async () => {
  try {
    console.log('Running auto-submission check...');
    const result = await autoSubmissionService.processAutoSubmissions();
    
    if (result.success && result.totalAutoSubmitted > 0) {
      console.log(`Auto-submission completed: ${result.totalAutoSubmitted} submissions processed`);
    }
  } catch (error) {
    console.error('Auto-submission cron job error:', error);
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

console.log('Auto-submission cron job scheduled to run every minute');