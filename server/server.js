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
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/course-content', require('./routes/courseContent'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/admin/teacher-attendance', require('./routes/adminTeacherAttendance'));
app.use('/api/compiler', require('./routes/compiler'));
app.use('/api/judge', require('./routes/judge'));
app.use('/api/auto-submission', require('./routes/autoSubmission'));
app.use('/api/profile', require('./routes/profile'));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Auto-submission cron job setup
const autoSubmissionService = require('./services/autoSubmissionService');
const Classroom = require('./models/Classroom');

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

// Classroom auto-archive job: run daily at 01:00 UTC
cron.schedule('0 1 * * *', async () => {
  try {
    console.log('Running classroom auto-archive check...');
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Find classrooms that are not archived and whose endMonth is defined and behind current month in the same academic year window
    const candidates = await Classroom.find({ isArchived: false, endMonth: { $ne: null } });
    for (const cls of candidates) {
      try {
        // Determine the AY window from academicYear string like "2024-2025"
        const [startYearStr, endYearStr] = (cls.academicYear || '').split('-');
        const startYear = parseInt(startYearStr, 10);
        const endYear = parseInt(endYearStr, 10);
        if (!startYear || !endYear) continue;

        // Map month to a comparable ordinal across the AY window
        // Academic year assumed to start in July. Compute an ordinal where July=1 ... June=12
        const toAyOrdinal = (month) => {
          // month: 1..12; July (7) -> 1; ... June (6) -> 12
          return ((month + 5) % 12) + 1;
        };
        const nowOrdinal = toAyOrdinal(currentMonth);

        const endOrdinal = toAyOrdinal(cls.endMonth);
        if (nowOrdinal > endOrdinal) {
          cls.isArchived = true;
          cls.archivedAt = new Date();
          cls.archivedBy = null;
          cls.archivedReason = 'Auto-archived: semester ended';
          await cls.save();
        }
      } catch (e) {
        console.error('Auto-archive error for classroom', cls._id?.toString(), e);
      }
    }
  } catch (error) {
    console.error('Classroom auto-archive cron job error:', error);
  }
}, {
  scheduled: true,
  timezone: 'UTC'
});

console.log('Classroom auto-archive cron job scheduled daily at 01:00 UTC');