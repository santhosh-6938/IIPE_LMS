const express = require('express');
const Classroom = require('../models/Classroom');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { sendNotificationEmail } = require('../services/emailService');
const multer = require('multer');
const XLSX = require('xlsx');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    const type = (file.mimetype || '').toLowerCase();
    const isExcel = type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      type === 'application/vnd.ms-excel' ||
      name.endsWith('.xlsx') ||
      name.endsWith('.xls');
    const isCsv = type === 'text/csv' || name.endsWith('.csv');
    if (isExcel || isCsv) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx, .xls or .csv files are allowed'));
    }
  }
});

// Configure multer for cover image uploads
const uploadCoverImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'classroom-cover-' + uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed for cover images'));
    }
  }
});

const router = express.Router();

// Get classrooms (role-based)
router.get('/', auth, async (req, res) => {
  try {
    let classrooms;

    const includeArchived = req.query && (req.query.includeArchived === 'true');

    if (req.user.role === 'teacher') {
      const baseQuery = { teacher: req.user._id };
      if (!includeArchived) baseQuery.isArchived = false;
      classrooms = await Classroom.find(baseQuery)
        .populate('teacher', 'name email')
        .populate('students', 'name email rollNumber createdAt')
        .sort({ createdAt: -1 });
    } else {
      const baseQuery = { students: req.user._id };
      if (!includeArchived) baseQuery.isArchived = false;
      classrooms = await Classroom.find(baseQuery)
        .populate('teacher', 'name email')
        .populate('students', 'name email rollNumber createdAt')
        .sort({ createdAt: -1 });
    }

    // Log activity
    try { const { logActivity } = require('../middleware/activity'); await logActivity(req, 'classroom.list', 'classroom', '', { count: classrooms.length }); } catch {}
    res.json(classrooms);
  } catch (error) {
    console.error('Get classrooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create classroom (teacher only)
router.post('/', auth, authorize('teacher'), async (req, res) => {
  try {
    const { name, description, subject, semester, academicYear, program, branch, startMonth, endMonth } = req.body;

    // Enforce concise description on server
    const countWords = (s) => (typeof s === 'string' && s.trim()) ? s.trim().split(/\s+/).length : 0;
    const DESC_LIMIT = 60;
    if (countWords(description) > DESC_LIMIT) {
      return res.status(400).json({ message: `Description too long. Max ${DESC_LIMIT} words.` });
    }

    // Validate required new fields
    const validSemesters = ['Autumn', 'Spring'];
    const validPrograms = ['B.Tech', 'M.Tech', 'M.Sc'];
    if (!validSemesters.includes(semester)) {
      return res.status(400).json({ message: 'Invalid semester' });
    }
    if (!validPrograms.includes(program)) {
      return res.status(400).json({ message: 'Invalid program' });
    }
    if (!academicYear || !/^[0-9]{4}-[0-9]{4}$/.test(academicYear)) {
      return res.status(400).json({ message: 'Invalid academic year' });
    }
    if (!branch || typeof branch !== 'string' || !branch.trim()) {
      return res.status(400).json({ message: 'Branch is required' });
    }

    const classroom = new Classroom({
      name,
      description,
      subject,
      semester,
      academicYear,
      program,
      branch,
      startMonth: startMonth || null,
      endMonth: endMonth || null,
      teacher: req.user._id
    });

    await classroom.save();
    
    await classroom.populate('teacher', 'name email');

    res.status(201).json(classroom);
  } catch (error) {
    console.error('Create classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single classroom
router.get('/:id', auth, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email rollNumber createdAt');

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check access permissions
    const hasAccess = req.user.role === 'teacher' 
      ? classroom.teacher._id.toString() === req.user._id.toString()
      : classroom.students.some(student => student._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(classroom);
  } catch (error) {
    console.error('Get classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update classroom (teacher only)
router.put('/:id', auth, authorize('teacher'), async (req, res) => {
  try {
    const { name, description, subject, semester, academicYear, program, branch, startMonth, endMonth, coverImage } = req.body;

    const countWords = (s) => (typeof s === 'string' && s.trim()) ? s.trim().split(/\s+/).length : 0;
    const DESC_LIMIT = 60;
    if (description !== undefined && countWords(description) > DESC_LIMIT) {
      return res.status(400).json({ message: `Description too long. Max ${DESC_LIMIT} words.` });
    }

    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if teacher owns this classroom
    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Optional updates with validation when provided
    if (name !== undefined) classroom.name = name || classroom.name;
    if (description !== undefined) classroom.description = description || classroom.description;
    if (subject !== undefined) classroom.subject = subject || classroom.subject;
    if (coverImage !== undefined) classroom.coverImage = coverImage || classroom.coverImage;
    const validSemesters = ['Autumn', 'Spring'];
    const validPrograms = ['B.Tech', 'M.Tech', 'M.Sc'];
    if (semester !== undefined) {
      if (!validSemesters.includes(semester)) {
        return res.status(400).json({ message: 'Invalid semester' });
      }
      classroom.semester = semester;
    }
    if (academicYear !== undefined) {
      if (!/^[0-9]{4}-[0-9]{4}$/.test(academicYear)) {
        return res.status(400).json({ message: 'Invalid academic year' });
      }
      classroom.academicYear = academicYear;
    }
    if (program !== undefined) {
      if (!validPrograms.includes(program)) {
        return res.status(400).json({ message: 'Invalid program' });
      }
      classroom.program = program;
    }
    if (branch !== undefined) {
      if (!branch || !branch.trim()) {
        return res.status(400).json({ message: 'Invalid branch' });
      }
      classroom.branch = branch.trim();
    }
    if (startMonth !== undefined) {
      const m = Number(startMonth);
      if (Number.isNaN(m) || m < 1 || m > 12) return res.status(400).json({ message: 'Invalid start month' });
      classroom.startMonth = m;
    }
    if (endMonth !== undefined) {
      const m = Number(endMonth);
      if (Number.isNaN(m) || m < 1 || m > 12) return res.status(400).json({ message: 'Invalid end month' });
      classroom.endMonth = m;
    }

    // Prevent edits if archived (except description/metadata, we can still allow basic edits)
    // For safety, only metadata edits allowed already above. Proceed to save.
    await classroom.save();
    await classroom.populate('teacher', 'name email');
    await classroom.populate('students', 'name email rollNumber createdAt');

    res.json(classroom);
  } catch (error) {
    console.error('Update classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete classroom (teacher only)
router.delete('/:id', auth, authorize('teacher'), async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if teacher owns this classroom
    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If archived, allow deletion; otherwise, also allow. Consider soft delete later.
    await Classroom.findByIdAndDelete(req.params.id);
    res.json({ message: 'Classroom deleted successfully' });
  } catch (error) {
    console.error('Delete classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Archive classroom (teacher only)
router.post('/:id/archive', auth, authorize('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const classroom = await Classroom.findById(id)
      .populate('teacher', 'name email')
      .populate('students', 'name email rollNumber createdAt');
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    if (classroom.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (classroom.isArchived) {
      return res.status(400).json({ message: 'Classroom already archived' });
    }
    classroom.isArchived = true;
    classroom.archivedAt = new Date();
    classroom.archivedBy = req.user._id;
    if (typeof reason === 'string' && reason.trim()) classroom.archivedReason = reason.trim();
    await classroom.save();
    return res.json({ message: 'Classroom archived', classroom });
  } catch (error) {
    console.error('Archive classroom error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Unarchive classroom (teacher only)
router.post('/:id/unarchive', auth, authorize('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const classroom = await Classroom.findById(id)
      .populate('teacher', 'name email')
      .populate('students', 'name email rollNumber createdAt');
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    if (classroom.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (!classroom.isArchived) {
      return res.status(400).json({ message: 'Classroom is not archived' });
    }
    classroom.isArchived = false;
    classroom.archivedAt = null;
    classroom.archivedBy = null;
    classroom.archivedReason = null;
    await classroom.save();
    return res.json({ message: 'Classroom unarchived', classroom });
  } catch (error) {
    console.error('Unarchive classroom error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Join classroom functionality has been removed

// Get all students (for teacher to add to classroom)
router.get('/students/available', auth, authorize('teacher'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email rollNumber createdAt')
      .sort({ name: 1 });

    res.json(students);
  } catch (error) {
    console.error('Get available students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add students to classroom (teacher only)
router.post('/:classroomId/students', auth, authorize('teacher'), async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { studentIds } = req.body;

    const classroom = await Classroom.findById(classroomId)
      .populate('teacher', 'name email')
      .populate('students', 'name email rollNumber createdAt');

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if teacher owns this classroom
    if (classroom.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get students to add
    const studentsToAdd = await User.find({ 
      _id: { $in: studentIds },
      role: 'student'
    });

    // Add students who are not already in the classroom
    const newStudents = [];
    for (const student of studentsToAdd) {
      const isAlreadyMember = classroom.students.some(
        existingStudent => existingStudent._id.toString() === student._id.toString()
      );
      
      if (!isAlreadyMember) {
        classroom.students.push(student._id);
        newStudents.push(student);
      }
    }

    if (newStudents.length === 0) {
      return res.status(400).json({ message: 'All selected students are already in the classroom' });
    }

    await classroom.save();
    await classroom.populate('students', 'name email rollNumber createdAt');

    // Create notifications for added students
    for (const student of newStudents) {
      try {
        const notification = new Notification({
          recipient: student._id,
          sender: req.user._id,
          type: 'classroom',
          title: 'Added to Classroom',
          message: `You have been added to the classroom "${classroom.name}" by ${req.user.name}`,
          data: {
            classroomId: classroom._id
          }
        });
        await notification.save();
        console.log(`Notification created for student ${student.email}`);

        // Send email notification (optional - won't break if it fails)
        try {
          if (process.env.MAIL_USER && process.env.MAIL_PASS) {
            await sendNotificationEmail(
              student.email,
              student.name,
              notification
            );
            console.log(`Email sent to ${student.email}`);
          } else {
            console.log('Email service not configured, skipping email notification');
          }
        } catch (emailError) {
          console.error('Failed to send email to student:', emailError);
          // Don't fail the entire operation if email fails
        }
      } catch (notificationError) {
        console.error('Failed to create notification for student:', notificationError);
        // Don't fail the entire operation if notification creation fails
      }
    }

    res.json({
      classroom,
      addedStudents: newStudents.length,
      message: `Successfully added ${newStudents.length} student(s) to the classroom`
    });
  } catch (error) {
    console.error('Add students to classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a single student from classroom (teacher only)
router.delete('/:classroomId/students/:studentId', auth, authorize('teacher'), async (req, res) => {
  try {
    const { classroomId, studentId } = req.params;

    const classroom = await Classroom.findById(classroomId)
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if teacher owns this classroom
    if (classroom.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const beforeCount = classroom.students.length;
    classroom.students = classroom.students.filter(
      s => s._id.toString() !== studentId
    );

    if (classroom.students.length === beforeCount) {
      return res.status(404).json({ message: 'Student is not in this classroom' });
    }

    await classroom.save();
    await classroom.populate('students', 'name email');

    // Optional: clean up today's attendance record entry for this student
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const attendance = await Attendance.findOne({
        classroom: classroomId,
        date: { $gte: today, $lt: tomorrow }
      });
      if (attendance && !attendance.isFrozen) {
        attendance.records = attendance.records.filter(
          r => r.student.toString() !== studentId
        );
        attendance.totalStudents = classroom.students.length;
        attendance.updateCounts();
        await attendance.save();
      }
    } catch (attErr) {
      console.error('Cleanup attendance after removal failed:', attErr);
    }

    return res.json({
      message: 'Student removed from classroom',
      classroom
    });
  } catch (error) {
    console.error('Remove student from classroom error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Bulk import students from Excel/CSV file (teacher only)
router.post('/:classroomId/students/bulk-import', auth, authorize('teacher'), (req, res) => {
  // Wrap multer to capture errors and return JSON
  upload.single('excelFile')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Invalid file upload' });
    }
    try {
      const { classroomId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ message: 'Please upload an Excel or CSV file' });
      }

      const classroom = await Classroom.findById(classroomId)
        .populate('teacher', 'name email')
        .populate('students', 'name email rollNumber');

      if (!classroom) {
        return res.status(404).json({ message: 'Classroom not found' });
      }

      // Check if teacher owns this classroom
      if (classroom.teacher._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Parse Excel/CSV file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (data.length < 2) {
        return res.status(400).json({ message: 'File must contain a header row and at least one data row' });
      }

      // Extract headers and data, normalize headers (lowercase, remove spaces/underscores)
      const rawHeaders = data[0].map(header => header ? header.toString() : '');
      const headers = rawHeaders.map(h => h.toLowerCase().trim().replace(/\s+/g, '').replace(/_/g, ''));
      const rows = data.slice(1);

      // Validate required columns with flexible header names
      const findIndexFor = (candidates) => {
        for (const c of candidates) {
          const idx = headers.indexOf(c);
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const nameIndex = findIndexFor(['name', 'fullname']);
      const emailIndex = findIndexFor(['email', 'emailaddress']);
      // Accept several variants for roll number: rollnumber, rollno, rollnumberwithspace, etc.
      const rollNumberIndex = findIndexFor(['rollnumber', 'rollno', 'roll', 'rollnumberid']);

      const missing = [];
      if (nameIndex === -1) missing.push('name');
      if (emailIndex === -1) missing.push('email');
      if (rollNumberIndex === -1) missing.push('roll number');
      
      if (missing.length > 0) {
        return res.status(400).json({ 
          message: `Missing required columns: ${missing.join(', ')}. Required columns include: Name, Email, Roll Number (accepted headers: rollnumber | roll_number | roll no | roll number | rollno | rollNumber)` 
        });
      }

      // Get column indices already computed above

      const results = {
        totalRows: rows.length,
        processed: 0,
        added: 0,
        alreadyInClassroom: 0,
        alreadyExists: 0,
        errors: []
      };

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because we start from row 2 (after header)

        try {
          const name = row[nameIndex] ? row[nameIndex].toString().trim() : '';
          const email = row[emailIndex] ? row[emailIndex].toString().trim() : '';
          const rollNumber = row[rollNumberIndex] ? row[rollNumberIndex].toString().trim().toUpperCase() : '';

          // Validate data
          if (!name || !email || !rollNumber) {
            results.errors.push(`Row ${rowNumber}: Name, email, and roll number are required`);
            continue;
          }

          if (!email.includes('@')) {
            results.errors.push(`Row ${rowNumber}: Invalid email format`);
            continue;
          }

          results.processed++;

          // Check if student already exists in the system by email or roll number
          let student = await User.findOne({ 
            $or: [
              { email: email.toLowerCase() },
              { rollNumber: rollNumber }
            ]
          });
          
          if (!student) {
            // Create new student account
            student = new User({
              name,
              email: email.toLowerCase(),
              rollNumber: rollNumber,
              password: Math.random().toString(36).slice(-8), // Generate random password
              role: 'student'
            });
            await student.save();
            results.added++;
          } else {
            // Check if student is already in this classroom
            const isAlreadyInClassroom = classroom.students.some(
              existingStudent => existingStudent._id.toString() === student._id.toString()
            );
            
            if (isAlreadyInClassroom) {
              results.alreadyInClassroom++;
              continue;
            }
            
            results.alreadyExists++;
          }

          // Add student to classroom
          classroom.students.push(student._id);

          // Create notification for student
          try {
            const notification = new Notification({
              recipient: student._id,
              sender: req.user._id,
              type: 'classroom',
              title: 'Added to Classroom',
              message: `You have been added to the classroom "${classroom.name}" by ${req.user.name}`,
              data: {
                classroomId: classroom._id
              }
            });
            await notification.save();

            // Send email notification (optional)
            try {
              if (process.env.MAIL_USER && process.env.MAIL_PASS) {
                await sendNotificationEmail(
                  student.email,
                  student.name,
                  notification
                );
              }
            } catch (emailError) {
              console.error('Failed to send email to student:', emailError);
            }
          } catch (notificationError) {
            console.error('Failed to create notification for student:', notificationError);
          }

        } catch (error) {
          results.errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      }

      // Save classroom with new students
      await classroom.save();
      await classroom.populate('students', 'name email');

      return res.json({
        classroom,
        results,
        message: `Bulk import completed. ${results.added} new students created, ${results.alreadyExists} existing students added, ${results.alreadyInClassroom} already in classroom.`
      });

    } catch (error) {
      console.error('Bulk import students error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
});

// Upload cover image for classroom (teacher only)
router.post('/:id/cover-image', auth, authorize('teacher'), uploadCoverImage.single('coverImage'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    const classroom = await Classroom.findById(id);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if teacher owns this classroom
    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update classroom with new cover image
    classroom.coverImage = req.file.filename;
    await classroom.save();

    await classroom.populate('teacher', 'name email');
    await classroom.populate('students', 'name email rollNumber createdAt');

    res.json({
      message: 'Cover image uploaded successfully',
      classroom,
      coverImageUrl: `/api/classrooms/cover-image/${req.file.filename}`
    });
  } catch (error) {
    console.error('Upload cover image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cover image
router.get('/cover-image/:filename', (req, res) => {
  const { filename } = req.params;
  const path = require('path');
  const fs = require('fs');
  
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Image not found' });
  }
  
  // Set appropriate content type
  const ext = path.extname(filename).toLowerCase();
  const contentType = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  }[ext] || 'image/jpeg';
  
  res.setHeader('Content-Type', contentType);
  res.sendFile(filePath);
});

module.exports = router;