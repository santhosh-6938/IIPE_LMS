const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CourseContent = require('../models/CourseContent');
const Classroom = require('../models/Classroom');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { sendNotificationEmail } = require('../services/emailService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Test route to check course content API
router.get('/test', auth, async (req, res) => {
  try {
    
    // Get all course content
    const allContent = await CourseContent.find({}).populate('classroom', 'name teacher');
    
    // Get all classrooms
    const allClassrooms = await Classroom.find({});
    
    res.json({
      message: 'Database test successful',
      contentCount: allContent.length,
      classroomCount: allClassrooms.length,
      user: {
        id: req.user._id,
        role: req.user.role,
        name: req.user.name
      }
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ message: 'Test route error', error: error.message });
  }
});

// Get course content for a classroom
router.get('/classroom/:classroomId', auth, async (req, res) => {
  try {
    const { classroomId } = req.params;
    
    // Check if user has access to this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    const hasAccess = req.user.role === 'teacher' 
      ? classroom.teacher.toString() === req.user._id.toString()
      : classroom.students.some(student => student.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const content = await CourseContent.find({ classroom: classroomId })
      .populate('uploadedBy', 'name email')
      .sort({ order: 1, createdAt: -1 });

    res.json(content);
  } catch (error) {
    console.error('Get course content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload course content (teacher only)
router.post('/upload/:classroomId', auth, authorize('teacher'), upload.single('file'), async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { title, description, type, isPublic } = req.body;

    // Enforce concise description on server
    const countWords = (s) => (typeof s === 'string' && s.trim()) ? s.trim().split(/\s+/).length : 0;
    const DESC_LIMIT = 80;
    if (countWords(description) > DESC_LIMIT) {
      return res.status(400).json({ message: `Description too long. Max ${DESC_LIMIT} words.` });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if teacher owns this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create course content
    const courseContent = new CourseContent({
      classroom: classroomId,
      title,
      description,
      type,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
      isPublic: isPublic !== 'false'
    });
    
    await courseContent.save();
    await courseContent.populate('uploadedBy', 'name email');

    // Create notifications for students
    const notifications = classroom.students.map(studentId => ({
      recipient: studentId,
      sender: req.user._id,
      type: 'classroom',
      title: 'New Course Content Added',
      message: `New ${type} "${title}" has been added to ${classroom.name}`,
      data: {
        classroomId: classroom._id,
        contentId: courseContent._id
      }
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Send email notifications to students
    const students = await User.find({ _id: { $in: classroom.students } });
    for (const student of students) {
      try {
        await sendNotificationEmail(
          student.email,
          student.name,
          {
            title: 'New Course Content Added',
            message: `New ${type} "${title}" has been added to ${classroom.name}`
          }
        );
      } catch (emailError) {
        console.error('Failed to send email to student:', emailError);
      }
    }

    res.status(201).json(courseContent);
  } catch (error) {
    console.error('Upload course content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update course content (teacher only)
router.put('/:contentId', auth, authorize('teacher'), async (req, res) => {
  try {
    const { contentId } = req.params;
    const { title, description, isPublic, order } = req.body;

    const courseContent = await CourseContent.findById(contentId)
      .populate('classroom', 'teacher')
      .populate('uploadedBy', 'name email');

    if (!courseContent) {
      return res.status(404).json({ message: 'Course content not found' });
    }

    // Check if teacher owns this classroom
    if (courseContent.classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    courseContent.title = title || courseContent.title;
    courseContent.description = description || courseContent.description;
    courseContent.isPublic = isPublic !== undefined ? isPublic : courseContent.isPublic;
    courseContent.order = order !== undefined ? order : courseContent.order;

    await courseContent.save();

    res.json(courseContent);
  } catch (error) {
    console.error('Update course content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete course content (teacher only)
router.delete('/:contentId', auth, authorize('teacher'), async (req, res) => {
  try {
    const { contentId } = req.params;

    const courseContent = await CourseContent.findById(contentId)
      .populate('classroom', 'teacher');

    if (!courseContent) {
      return res.status(404).json({ message: 'Course content not found' });
    }

    // Check if teacher owns this classroom
    if (courseContent.classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from filesystem
    const filePath = path.join(
      __dirname,
      '..',
      courseContent.fileUrl.replace(/^[/\\]+/, '')
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await CourseContent.findByIdAndDelete(contentId);

    res.json({ message: 'Course content deleted successfully' });
  } catch (error) {
    console.error('Delete course content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve uploaded files
router.get('/file/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    // Check if user has access to this file
    // Look for course content where fileUrl contains the filename
    const courseContent = await CourseContent.findOne({ 
      $or: [
        { fileUrl: `/uploads/${filename}` },
        { fileUrl: `uploads/${filename}` },
        { fileUrl: filename }
      ]
    }).populate('classroom', 'teacher students');
    
    if (!courseContent) {
      return res.status(404).json({ message: 'Course content not found in database' });
    }

    // Check access permissions
    let hasAccess = false;
    
    if (req.user.role === 'teacher') {
      // Teachers can access files from classrooms they own
      hasAccess = courseContent.classroom.teacher.toString() === req.user._id.toString();
    } else if (req.user.role === 'student') {
      // Students can access public files from classrooms they're enrolled in
      hasAccess = courseContent.isPublic && 
                  courseContent.classroom.students.some(student => student.toString() === req.user._id.toString());
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this file' });
    }

    // Set proper headers for file download/preview
    res.setHeader('Content-Type', courseContent.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${courseContent.fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve file error:', error);
    res.status(500).json({ message: 'Server error serving file' });
  }
});

module.exports = router;
