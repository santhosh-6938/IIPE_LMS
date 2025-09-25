const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Task = require('../models/Task');
const Classroom = require('../models/Classroom');
const Notification = require('../models/Notification');
const User = require('../models/User');
const File = require('../models/File');
const { auth, authorize } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');
const { sendTaskAssignmentEmail, sendTaskSubmissionEmail } = require('../services/emailService');

const router = express.Router();

// Test route to check tasks API
router.get('/test', auth, async (req, res) => {
  try {
    // Get all tasks
    const allTasks = await Task.find({}).populate('classroom', 'name');
    
    // Get all classrooms
    const allClassrooms = await Classroom.find({});
    
    // Get all files
    const allFiles = await File.find({});
    
    res.json({
      message: 'Tasks API test successful',
      taskCount: allTasks.length,
      classroomCount: allClassrooms.length,
      fileCount: allFiles.length,
      tasks: allTasks.map(t => ({ id: t._id, title: t.title, submissions: t.submissions?.length || 0 })),
      user: {
        id: req.user._id,
        role: req.user.role,
        name: req.user.name
      }
    });
  } catch (error) {
    console.error('Tasks test route error:', error);
    res.status(500).json({ message: 'Tasks test route error', error: error.message });
  }
});

// Debug route to check task ownership and authentication
router.get('/debug/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate('classroom').populate('teacher', 'name');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isTeacher = req.user.role === 'teacher' && task.teacher._id.toString() === req.user._id.toString();
    const isStudentInClass = req.user.role === 'student' && task.classroom.students.some(s => s.toString() === req.user._id.toString());

    res.json({
      task: {
        id: task._id,
        title: task.title,
        teacher: {
          id: task.teacher._id,
          name: task.teacher.name
        },
        classroom: {
          id: task.classroom._id,
          name: task.classroom.name,
          students: task.classroom.students
        },
        submissions: task.submissions?.length || 0
      },
      user: {
        id: req.user._id,
        role: req.user.role,
        name: req.user.name
      },
      access: {
        isTeacher,
        isStudentInClass,
        canAccess: isTeacher || isStudentInClass
      }
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({ message: 'Debug route error', error: error.message });
  }
});

// Check current user authentication
router.get('/auth/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        role: req.user.role,
        name: req.user.name,
        email: req.user.email
      },
      authenticated: true,
      token: req.header('Authorization') ? 'Present' : 'Missing'
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ message: 'Auth check error', error: error.message });
  }
});

// Debug route to check authentication headers
router.get('/auth/debug', (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    res.json({
      hasAuthHeader: !!authHeader,
      authHeader: authHeader ? authHeader.substring(0, 20) + '...' : 'None',
      allHeaders: Object.keys(req.headers),
      userAgent: req.header('User-Agent'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth debug error:', error);
    res.status(500).json({ message: 'Auth debug error', error: error.message });
  }
});

// Test authentication route
router.get('/auth/test', auth, (req, res) => {
  res.json({
    authenticated: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role
    },
    timestamp: new Date().toISOString()
  });
});

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
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar)$/i;
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed',
      'application/octet-stream' // Fallback for some file types
    ];

    const hasValidExtension = allowedExtensions.test(file.originalname);
    const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);

    if (hasValidExtension || hasValidMimeType) {
      return cb(null, true);
    } else {
      console.log('File rejected:', file.originalname, file.mimetype);
      cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.source}`));
    }
  }
});

// Get task count
router.get('/count', auth, async (req, res) => {
  try {
    let query = {};
    const { classroom } = req.query;

    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
      if (classroom) {
        query.classroom = classroom;
      }
    } else {
      // For students, get tasks from their classrooms
      const userClassrooms = await Classroom.find({ students: req.user._id });
      const classroomIds = userClassrooms.map(c => c._id);
      query.classroom = { $in: classroomIds };
      
      if (classroom && classroomIds.some(id => id.toString() === classroom)) {
        query.classroom = classroom;
      }
    }

    const count = await Task.countDocuments(query);
    res.json({ count });
  } catch (error) {
    console.error('Get task count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks (role-based filtering)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    const { classroom } = req.query;

    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
      if (classroom) {
        query.classroom = classroom;
      }
    } else {
      // For students, get tasks from their classrooms
      const userClassrooms = await Classroom.find({ students: req.user._id });
      const classroomIds = userClassrooms.map(c => c._id);
      query.classroom = { $in: classroomIds };
      
      if (classroom && classroomIds.some(id => id.toString() === classroom)) {
        query.classroom = classroom;
      }
    }

    const tasks = await Task.find(query)
      .populate('classroom', 'name students')
      .populate('teacher', 'name')
      .populate('submissions.student', 'name')
      .populate('submissions.files')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks for a specific classroom
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

    const tasks = await Task.find({ classroom: classroomId })
      .populate('teacher', 'name')
      .populate('submissions.student', 'name')
      .populate('submissions.files')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks by classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task (teacher only)
router.post('/', auth, authorize('teacher'), upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, classroom, deadline, instructions, maxSubmissions, isCodingAssignment, problemId } = req.body;

    // Enforce server-side word limits to prevent unnecessary data
    const countWords = (s) => (typeof s === 'string' && s.trim()) ? s.trim().split(/\s+/).length : 0;
    const DESC_LIMIT = 100;
    const INSTR_LIMIT = 200;
    if (countWords(description) > DESC_LIMIT) {
      return res.status(400).json({ message: `Description too long. Max ${DESC_LIMIT} words.` });
    }
    if (countWords(instructions) > INSTR_LIMIT) {
      return res.status(400).json({ message: `Instructions too long. Max ${INSTR_LIMIT} words.` });
    }

    // Verify teacher owns the classroom
    const classroomDoc = await Classroom.findById(classroom);
    if (!classroomDoc) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (classroomDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Disallow creating tasks in archived classrooms
    if (classroomDoc.isArchived) {
      return res.status(400).json({ message: 'Cannot create tasks in archived classrooms' });
    }

    // Create the task first
    const task = new Task({
      title,
      description,
      classroom,
      teacher: req.user._id,
      deadline: deadline ? new Date(deadline) : null,
      instructions,
      maxSubmissions: maxSubmissions || 1,
      attachments: [],
      isCodingAssignment: !!isCodingAssignment,
      problem: problemId || null
    });

    // If coding assignment, validate problem belongs to this teacher's classroom context (optional)
    if (task.isCodingAssignment && task.problem) {
      try {
        const Problem = require('../models/Problem');
        const prob = await Problem.findById(task.problem);
        if (!prob) {
          return res.status(400).json({ message: 'Invalid problemId' });
        }
        if (prob.classroom && prob.classroom.toString() !== classroomDoc._id.toString()) {
          return res.status(400).json({ message: 'Problem is not assigned to this classroom' });
        }
      } catch (e) {
        return res.status(400).json({ message: 'Invalid problem reference' });
      }
    }

    await task.save();

    // Process attachments and save to File collection
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileDoc = new File({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          uploadedBy: req.user._id,
          taskId: task._id,
          fileType: 'task_attachment'
        });
        await fileDoc.save();
        
        attachments.push({
          _id: fileDoc._id,
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        });
      }
    }

    // Update task with attachments if any
    if (attachments.length > 0) {
      task.attachments = attachments;
      await task.save();
    }
    await task.populate('classroom', 'name');
    await task.populate('teacher', 'name');

    // Create notifications for all students in the classroom
    const notifications = classroomDoc.students.map(studentId => ({
      recipient: studentId,
      sender: req.user._id,
      type: 'task',
      title: 'New Task Assigned',
      message: `New task "${title}" has been assigned in ${classroomDoc.name}`,
      data: {
        classroomId: classroom,
        taskId: task._id
      }
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      
      // Send email notifications to all students
      const students = await User.find({ _id: { $in: classroomDoc.students } });
      for (const student of students) {
        try {
          await sendTaskAssignmentEmail(
            student.email,
            student.name,
            title,
            classroomDoc.name,
            req.user.name
          );
        } catch (emailError) {
          console.error('Failed to send email to student:', student.email, emailError);
        }
      }
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    
    // Handle specific error types
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({ 
        message: 'Invalid file type. Please upload only: PDF, DOC, DOCX, TXT, ZIP, RAR, JPG, PNG, GIF files.' 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error: ' + Object.values(error.errors).map(e => e.message).join(', ') 
      });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum file size is 10MB.' 
      });
    }
    
    res.status(500).json({ message: 'Failed to create task. Please try again.' });
  }
}, (error, req, res, next) => {
  // Handle multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum file size is 10MB.' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Too many files. Maximum 5 files allowed.' 
      });
    }
    return res.status(400).json({ 
      message: 'File upload error: ' + error.message 
    });
  }
  
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({ 
      message: 'Invalid file type. Please upload only: PDF, DOC, DOCX, TXT, ZIP, RAR, JPG, PNG, GIF files.' 
    });
  }
  
  console.error('Task creation error:', error);
  res.status(500).json({ message: 'Failed to create task. Please try again.' });
});

// Submit or draft task (student only)
router.post('/:id/submit', auth, authorize('student'), upload.array('files', 3), async (req, res) => {
  try {
    const { content, status } = req.body; // status can be 'draft' or 'submitted'
    const taskId = req.params.id;

    // Enforce word limit on submission content
    const countWords = (s) => (typeof s === 'string' && s.trim()) ? s.trim().split(/\s+/).length : 0;
    const CONTENT_LIMIT = 150;
    if (countWords(content) > CONTENT_LIMIT) {
      return res.status(400).json({ message: `Content too long. Max ${CONTENT_LIMIT} words.` });
    }

    const task = await Task.findById(taskId).populate('classroom');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if student is in the classroom
    // Prevent submissions for tasks in archived classrooms
    if (task.classroom.isArchived) {
      return res.status(400).json({ message: 'Cannot submit tasks in archived classrooms' });
    }

    const isInClassroom = task.classroom.students.some(
      studentId => studentId.toString() === req.user._id.toString()
    );

    if (!isInClassroom) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check existing submission by this student
    const existingSubmissionIndex = task.submissions.findIndex(
      sub => sub.student.toString() === req.user._id.toString()
    );

    // Check deadline
    if (task.deadline && new Date() > task.deadline) {
      return res.status(400).json({ message: 'Task deadline has passed' });
    }

    // Check if student has already submitted (not draft)
    if (existingSubmissionIndex !== -1) {
      const existingSubmission = task.submissions[existingSubmissionIndex];
      if (existingSubmission.status === 'submitted' && status === 'submitted') {
        return res.status(400).json({ message: 'Task already submitted. Cannot submit again.' });
      }
    }

    // Process uploaded files and save to File collection
    const files = [];
    const filesToRemove = req.body.filesToRemove ? JSON.parse(req.body.filesToRemove) : [];
    
    if (req.files && req.files.length > 0) {
      // Save new files (append later to remaining files)
      for (const file of req.files) {
        const fileDoc = new File({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          uploadedBy: req.user._id,
          taskId: taskId,
          fileType: 'submission_file'
        });
        await fileDoc.save();
        
        files.push({
          _id: fileDoc._id,
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        });
      }
    }

    if (existingSubmissionIndex !== -1) {
      // Handle file removal and compute remaining files from existing
      const existing = task.submissions[existingSubmissionIndex];
      if (filesToRemove.length > 0) {
        // Remove specified files
        const removeIds = new Set(filesToRemove.map(id => id.toString()));
        const remainingFiles = (existing.files || []).filter(f => !removeIds.has((f._id || '').toString()));
        
        // Delete removed files from File collection and filesystem
        for (const fileId of filesToRemove) {
          const fileToRemove = (existing.files || []).find(f => (f._id || '').toString() === fileId.toString());
          if (fileToRemove) {
            try {
              await File.findByIdAndDelete(fileToRemove._id);
              const filePath = path.resolve(fileToRemove.path);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (error) {
              console.error('Error deleting file:', error);
            }
          }
        }
        
        // Start with remaining files
        files.unshift(...remainingFiles);
      } else {
        // Keep all existing files
        files.unshift(...(existing.files || []));
      }
    }

    // For coding assignments, allow simple finalization without files/content via query flag
    const finalizeCoding = req.query && req.query.finalize === 'true';

    // Build submission object
    const now = new Date();
    const normalizedStatus = status === 'draft' ? 'draft' : 'submitted';
    const submission = {
      student: req.user._id,
      content: finalizeCoding ? '[Coding assignment submitted]' : (content || ''),
      files,
      status: normalizedStatus,
      draftedAt: normalizedStatus === 'draft' ? now : undefined,
      submittedAt: normalizedStatus === 'submitted' ? now : undefined
    };

    if (existingSubmissionIndex !== -1) {
      // Update existing submission
      const existing = task.submissions[existingSubmissionIndex];
      
      // Update the existing submission
      const updatedSubmission = {
        ...existing.toObject(),
        content: submission.content || existing.content,
        files: files.length > 0 ? files : (existing.files || []),
        status: normalizedStatus,
        submittedAt: normalizedStatus === 'submitted' ? now : existing.submittedAt,
        draftedAt: normalizedStatus === 'draft' ? now : existing.draftedAt,
        updatedAt: now
      };
      
      task.submissions[existingSubmissionIndex] = updatedSubmission;
    } else {
      // Create new submission
      task.submissions.push(submission);
    }
    
    await task.save();
    await task.populate('submissions.student', 'name');

    // Notify teacher only for final submission (not for drafts)
    if (normalizedStatus === 'submitted') {
      const notification = new Notification({
        recipient: task.teacher,
        sender: req.user._id,
        type: 'task',
        title: 'Task Submitted',
        message: `${req.user.name} has submitted "${task.title}"`,
        data: {
          classroomId: task.classroom._id,
          taskId: task._id
        }
      });
      await notification.save();

      // Send email notification to teacher
      try {
        const teacher = await User.findById(task.teacher);
        if (teacher) {
          await sendTaskSubmissionEmail(
            teacher.email,
            teacher.name,
            req.user.name,
            task.title
          );
        }
      } catch (emailError) {
        console.error('Failed to send email to teacher:', emailError);
      }

      // Optional: notify student that interactions are now enabled
      try {
        const interactionNote = new Notification({
          recipient: req.user._id,
          sender: task.teacher,
          type: 'task',
          title: 'Interaction Enabled',
          message: `You can now interact with your teacher about "${task.title}"`,
          data: { taskId: task._id }
        });
        await interactionNote.save();
      } catch (e) {
        console.error('Failed to create interaction enabled notification:', e.message);
      }
    }

    res.json(task);
  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Discard current student's draft submission for a task (student only)
router.delete('/:id/draft', auth, authorize('student'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId).populate('classroom');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.classroom.isArchived) return res.status(400).json({ message: 'Cannot discard drafts in archived classrooms' });

    // Ensure student belongs to classroom
    const isInClassroom = task.classroom.students.some(
      studentId => studentId.toString() === req.user._id.toString()
    );
    if (!isInClassroom) return res.status(403).json({ message: 'Access denied' });

    // Find this student's submission
    const subIndex = task.submissions.findIndex(
      s => s.student.toString() === req.user._id.toString()
    );
    if (subIndex === -1) return res.status(404).json({ message: 'No draft found' });

    const sub = task.submissions[subIndex];
    if (sub.status !== 'draft') {
      return res.status(400).json({ message: 'Cannot discard a submitted task' });
    }

    // Delete associated files
    if (sub.files && sub.files.length > 0) {
      for (const file of sub.files) {
        try {
          await File.findByIdAndDelete(file._id);
          const filePath = path.resolve(file.path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          console.error('Error deleting draft file:', e);
        }
      }
    }

    // Remove the submission entry
    task.submissions.splice(subIndex, 1);
    await task.save();

    return res.json({ message: 'Draft discarded' });
  } catch (error) {
    console.error('Discard draft error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Download or preview a submission file (teacher or owning student)
router.get('/:taskId/submissions/:submissionId/files/:fileId/:action(preview|download)', auth, async (req, res) => {
  try {
    const { taskId, submissionId, fileId, action } = req.params;
    const task = await Task.findById(taskId).populate('classroom').populate('teacher', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.classroom.isArchived) return res.status(403).json({ message: 'Access denied' });

    // Access control: teacher owner of classroom or student who owns the submission
    const teacherId = typeof task.teacher === 'object' && task.teacher !== null ? task.teacher._id : task.teacher;
    const isTeacher = req.user.role === 'teacher' && teacherId && teacherId.toString() === req.user._id.toString();
    let submission = null;
    let isOwnerStudent = false;
    
    // Find the submission
    for (const sub of task.submissions) {
      if (sub._id.toString() === submissionId) {
        submission = sub;
        isOwnerStudent = req.user.role === 'student' && sub.student.toString() === req.user._id.toString();
        break;
      }
    }
    
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    
    // Allow access if teacher owns the task OR if student owns the submission
    if (!(isTeacher || isOwnerStudent)) {
      console.log('Access denied for submission file:', {
        userId: req.user._id,
        userRole: req.user.role,
        taskTeacher: task.teacher,
        isTeacher,
        isOwnerStudent,
        submissionId,
        fileId
      });
      return res.status(403).json({ message: 'Access denied' });
    }

    // First try to find file in File collection
    let fileDoc = await File.findById(fileId);
    if (!fileDoc) {
      // Fallback: try to find in submission files array
      const submissionFile = submission.files?.find(f => f._id?.toString() === fileId);
      if (!submissionFile) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Use file from submission object
      const filePath = path.resolve(submissionFile.path);
      if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing on server' });

      if (action === 'preview') {
        res.setHeader('Content-Type', submissionFile.mimetype || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${submissionFile.originalName || submissionFile.filename}"`);
        res.setHeader('Cache-Control', 'no-cache');
        const stream = fs.createReadStream(filePath);
        return stream.pipe(res);
      } else {
        return res.download(filePath, submissionFile.originalName || submissionFile.filename);
      }
    }

    // Use file from File collection
    const filePath = path.resolve(fileDoc.path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing on server' });

    if (action === 'preview') {
      res.setHeader('Content-Type', fileDoc.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${fileDoc.originalName || fileDoc.filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    } else {
      return res.download(filePath, fileDoc.originalName || fileDoc.filename);
    }
  } catch (error) {
    console.error('File access error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Download or preview a task attachment (teacher or any student of classroom)
router.get('/:taskId/attachments/:attachmentId/:action(preview|download)', auth, async (req, res) => {
  try {
    const { taskId, attachmentId, action } = req.params;
    const task = await Task.findById(taskId).populate('classroom');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.classroom.isArchived) return res.status(403).json({ message: 'Access denied' });

    // Access control: teacher owner or student in classroom
    const isTeacher = req.user.role === 'teacher' && task.teacher.toString() === req.user._id.toString();
    const isStudentInClass = req.user.role === 'student' && task.classroom.students.some(s => s.toString() === req.user._id.toString());
    if (!(isTeacher || isStudentInClass)) return res.status(403).json({ message: 'Access denied' });

    // First try to find in File collection (primary method)
    let fileDoc = await File.findById(attachmentId);
    if (!fileDoc) {
      // Fallback: try to find in task attachments array
      const attachment = task.attachments?.find(att => att._id?.toString() === attachmentId);
      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }
      
      // Use attachment from task object
      const filePath = path.resolve(attachment.path);
      if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing on server' });

      if (action === 'preview') {
        res.setHeader('Content-Type', attachment.mimetype || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName || attachment.filename}"`);
        const stream = fs.createReadStream(filePath);
        return stream.pipe(res);
      } else {
        return res.download(filePath, attachment.originalName || attachment.filename);
      }
    }

    // Use file from File collection
    const filePath = path.resolve(fileDoc.path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing on server' });

    if (action === 'preview') {
      res.setHeader('Content-Type', fileDoc.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${fileDoc.originalName || fileDoc.filename}"`);
      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    } else {
      return res.download(filePath, fileDoc.originalName || fileDoc.filename);
    }
  } catch (error) {
    console.error('Attachment access error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Direct file access by file ID for teachers (non-conflicting path)
// This must be above the generic '/:id' route to avoid conflicts
router.get('/file/:fileId/:action(preview|download)', auth, async (req, res) => {
  try {
    const { fileId, action } = req.params;

    const fileDoc = await File.findById(fileId);
    if (!fileDoc) return res.status(404).json({ message: 'File not found' });

    const task = await Task.findById(fileDoc.taskId).populate('teacher', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.classroom.isArchived) return res.status(403).json({ message: 'Access denied' });

    const teacherId = typeof task.teacher === 'object' && task.teacher !== null ? task.teacher._id : task.teacher;
    const isTeacher = req.user.role === 'teacher' && teacherId && teacherId.toString() === req.user._id.toString();
    if (!isTeacher) return res.status(403).json({ message: 'Access denied' });

    const filePath = path.resolve(fileDoc.path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing on server' });

    if (action === 'preview') {
      res.setHeader('Content-Type', fileDoc.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${fileDoc.originalName || fileDoc.filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    } else {
      return res.download(filePath, fileDoc.originalName || fileDoc.filename);
    }
  } catch (error) {
    console.error('Direct file access (non-conflicting) error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete a task (teacher only)
router.delete('/:id', auth, authorize('teacher'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('classroom');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.classroom.isArchived) return res.status(403).json({ message: 'Access denied' });
    if (task.classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete associated files from File collection
    await File.deleteMany({ taskId: task._id });
    
    // Delete the task
    await Task.deleteOne({ _id: task._id });
    return res.json({ success: true, id: task._id });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update a task (teacher only)
router.put('/:id', auth, authorize('teacher'), upload.array('attachments', 5), async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, deadline, instructions, maxSubmissions, status } = req.body;

    // Enforce server-side word limits
    const countWords = (s) => (typeof s === 'string' && s.trim()) ? s.trim().split(/\s+/).length : 0;
    const DESC_LIMIT = 100;
    const INSTR_LIMIT = 200;
    if (description !== undefined && countWords(description) > DESC_LIMIT) {
      return res.status(400).json({ message: `Description too long. Max ${DESC_LIMIT} words.` });
    }
    if (instructions !== undefined && countWords(instructions) > INSTR_LIMIT) {
      return res.status(400).json({ message: `Instructions too long. Max ${INSTR_LIMIT} words.` });
    }

    const task = await Task.findById(taskId).populate('classroom');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify the teacher owns the classroom
    if (task.classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update fields if provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (deadline !== undefined) task.deadline = deadline ? new Date(deadline) : null;
    if (instructions !== undefined) task.instructions = instructions;
    if (maxSubmissions !== undefined) task.maxSubmissions = Number(maxSubmissions);
    if (status !== undefined) task.status = status; // active/completed/archived

    // If files uploaded, append to attachments and save to File collection
    if (req.files && req.files.length > 0) {
      const newAttachments = [];
      for (const file of req.files) {
        const fileDoc = new File({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          uploadedBy: req.user._id,
          taskId: task._id,
          fileType: 'task_attachment'
        });
        await fileDoc.save();
        
        newAttachments.push({
          _id: fileDoc._id,
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        });
      }
      task.attachments = [...(task.attachments || []), ...newAttachments];
    }

    await task.save();
    await task.populate('teacher', 'name');
    await task.populate('submissions.student', 'name');

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set remarks on a student's submission (teacher only)
router.post('/:taskId/submissions/:studentId/remarks', auth, authorize('teacher'), async (req, res) => {
  try {
    const { taskId, studentId } = req.params;
    const { remarks } = req.body;

    const task = await Task.findById(taskId).populate('classroom');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.classroom.isArchived) return res.status(403).json({ message: 'Access denied' });
    if (task.classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const subIndex = task.submissions.findIndex(s => s.student.toString() === studentId);
    if (subIndex === -1) return res.status(404).json({ message: 'Submission not found for this student' });

    task.submissions[subIndex].remarks = remarks || '';
    task.submissions[subIndex].updatedAt = new Date();
    await task.save();
    await task.populate('submissions.student', 'name');

    res.json({ message: 'Remarks updated', task });
  } catch (error) {
    console.error('Set submission remarks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('classroom', 'name')
      .populate('teacher', 'name')
      .populate('submissions.student', 'name')
      .populate('submissions.files');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check access permissions
    let hasAccess = false;
    
    if (req.user.role === 'teacher') {
      hasAccess = task.teacher._id.toString() === req.user._id.toString();
    } else {
      // Check if student is in the classroom
      const classroom = await Classroom.findById(task.classroom._id);
      hasAccess = classroom.students.some(
        studentId => studentId.toString() === req.user._id.toString()
      );
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all files for a task (for debugging)
router.get('/:taskId/files', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate('classroom');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Access control: teacher owner or student in classroom
    const isTeacher = req.user.role === 'teacher' && task.teacher.toString() === req.user._id.toString();
    const isStudentInClass = req.user.role === 'student' && task.classroom.students.some(s => s.toString() === req.user._id.toString());
    if (!(isTeacher || isStudentInClass)) return res.status(403).json({ message: 'Access denied' });

    const files = await File.find({ taskId }).populate('uploadedBy', 'name');
    res.json({
      taskId,
      taskTitle: task.title,
      files: files.map(f => ({
        id: f._id,
        filename: f.filename,
        originalName: f.originalName,
        fileType: f.fileType,
        uploadedBy: f.uploadedBy.name,
        size: f.size,
        createdAt: f.createdAt
      }))
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all files (for debugging)
router.get('/files/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const files = await File.find({}).populate('uploadedBy', 'name');
    res.json(files);
  } catch (error) {
    console.error('Get all files error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get submission status for a task (for debugging)
router.get('/:taskId/submissions/status', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate('submissions.student', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Access control: teacher owner or student in classroom
    const isTeacher = req.user.role === 'teacher' && task.teacher.toString() === req.user._id.toString();
    const isStudentInClass = req.user.role === 'student' && task.classroom.students.some(s => s.toString() === req.user._id.toString());
    if (!(isTeacher || isStudentInClass)) return res.status(403).json({ message: 'Access denied' });

    const submissions = task.submissions.map(sub => ({
      student: sub.student.name,
      status: sub.status,
      content: sub.content ? sub.content.substring(0, 100) + '...' : 'No content',
      files: sub.files?.length || 0,
      submittedAt: sub.submittedAt,
      draftedAt: sub.draftedAt
    }));

    res.json({
      taskTitle: task.title,
      totalSubmissions: task.submissions.length,
      submissions
    });
  } catch (error) {
    console.error('Get submission status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user's submission status for a task
router.get('/:taskId/my-submission', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate('classroom');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check if user has access to this task
    const isTeacher = req.user.role === 'teacher' && task.teacher.toString() === req.user._id.toString();
    const isStudentInClass = req.user.role === 'student' && task.classroom.students.some(s => s.toString() === req.user._id.toString());
    
    if (!(isTeacher || isStudentInClass)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find user's submission
    const mySubmission = task.submissions.find(sub => 
      sub.student.toString() === req.user._id.toString()
    );

    res.json({
      taskId: task._id,
      taskTitle: task.title,
      userId: req.user._id,
      hasSubmission: !!mySubmission,
      submission: mySubmission ? {
        _id: mySubmission._id,
        student: req.user._id,
        status: mySubmission.status,
        submittedAt: mySubmission.submittedAt,
        draftedAt: mySubmission.draftedAt,
        content: mySubmission.content,
        files: mySubmission.files || [],
        isAutoSubmitted: mySubmission.isAutoSubmitted,
        autoSubmittedAt: mySubmission.autoSubmittedAt,
        interactionMessages: mySubmission.interactionMessages || [],
        interactionEnabled: mySubmission.status === 'submitted'
      } : null,
      isOverdue: task.deadline ? new Date() > new Date(task.deadline) : false,
      deadline: task.deadline,
      interactionEnabled: !!mySubmission && mySubmission.status === 'submitted'
    });
  } catch (error) {
    console.error('Get my submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get interaction messages for a task submission (student owner or teacher)
router.get('/:taskId/interactions', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate('classroom').populate('teacher', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Determine the target submission (student: own submission; teacher: requires studentId query)
    let submission = null;
    if (req.user.role === 'student') {
      submission = (task.submissions || []).find(s => s.student.toString() === req.user._id.toString());
      // Must have submitted to view interactions
      if (!submission || submission.status !== 'submitted') {
        return res.status(403).json({ message: 'Interactions not available' });
      }
      // Ensure student is in classroom
      const isStudentInClass = task.classroom.students.some(s => s.toString() === req.user._id.toString());
      if (!isStudentInClass) return res.status(403).json({ message: 'Access denied' });
    } else if (req.user.role === 'teacher') {
      const teacherId = typeof task.teacher === 'object' && task.teacher !== null ? task.teacher._id : task.teacher;
      if (!teacherId || teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const { studentId } = req.query;
      if (!studentId) return res.status(400).json({ message: 'studentId is required' });
      submission = (task.submissions || []).find(s => s.student.toString() === studentId.toString());
      if (!submission || submission.status !== 'submitted') {
        return res.status(404).json({ message: 'No submitted work for this student' });
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json({
      taskId: task._id,
      studentId: submission.student,
      interactionEnabled: submission.status === 'submitted',
      messages: submission.interactionMessages || []
    });
  } catch (error) {
    console.error('Get interactions error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Student posts a new interaction message (requires submitted status)
router.post('/:taskId/interactions', auth, authorize('student'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const task = await Task.findById(taskId).populate('classroom');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Ensure student belongs to classroom
    const isInClassroom = task.classroom.students.some(s => s.toString() === req.user._id.toString());
    if (!isInClassroom) return res.status(403).json({ message: 'Access denied' });

    const subIndex = (task.submissions || []).findIndex(s => s.student.toString() === req.user._id.toString());
    if (subIndex === -1) return res.status(403).json({ message: 'No submission found' });
    const submission = task.submissions[subIndex];
    if (submission.status !== 'submitted') return res.status(403).json({ message: 'Interactions available only after submission' });

    const entry = {
      sender: req.user._id,
      senderRole: 'student',
      message: message.trim(),
      createdAt: new Date(),
      readByTeacher: false,
      readByStudent: true
    };
    submission.interactionMessages = submission.interactionMessages || [];
    submission.interactionMessages.push(entry);
    submission.updatedAt = new Date();
    await task.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user._id,
        role: 'student',
        action: 'task_interaction_post',
        resourceType: 'task',
        resourceId: task._id.toString(),
        metadata: { messagePreview: entry.message.slice(0, 100) }
      });
    } catch {}

    // Notify teacher
    try {
      const notification = new Notification({
        recipient: task.teacher,
        sender: req.user._id,
        type: 'task',
        title: 'New Task Interaction',
        message: `${req.user.name} asked a question on "${task.title}"`,
        data: { taskId: task._id, studentId: req.user._id }
      });
      await notification.save();
    } catch (e) {
      console.error('Notification error (student -> teacher):', e.message);
    }

    return res.status(201).json({ messages: submission.interactionMessages });
  } catch (error) {
    console.error('Post interaction (student) error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Teacher replies to a student's interaction
router.post('/:taskId/interactions/reply', auth, authorize('teacher'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { studentId, message } = req.body;
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const task = await Task.findById(taskId).populate('teacher', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const teacherId = typeof task.teacher === 'object' && task.teacher !== null ? task.teacher._id : task.teacher;
    if (!teacherId || teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const subIndex = (task.submissions || []).findIndex(s => s.student.toString() === studentId.toString());
    if (subIndex === -1) return res.status(404).json({ message: 'Submission not found for this student' });
    const submission = task.submissions[subIndex];
    if (submission.status !== 'submitted') return res.status(403).json({ message: 'Interactions available only after submission' });

    const entry = {
      sender: req.user._id,
      senderRole: 'teacher',
      message: message.trim(),
      createdAt: new Date(),
      readByTeacher: true,
      readByStudent: false
    };
    submission.interactionMessages = submission.interactionMessages || [];
    submission.interactionMessages.push(entry);
    submission.updatedAt = new Date();
    await task.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user._id,
        role: 'teacher',
        action: 'task_interaction_reply',
        resourceType: 'task',
        resourceId: task._id.toString(),
        metadata: { studentId, messagePreview: entry.message.slice(0, 100) }
      });
    } catch {}

    // Notify student
    try {
      const notification = new Notification({
        recipient: studentId,
        sender: req.user._id,
        type: 'task',
        title: 'Teacher replied',
        message: `Teacher replied on your interaction for "${task.title}"`,
        data: { taskId: task._id }
      });
      await notification.save();
    } catch (e) {
      console.error('Notification error (teacher -> student):', e.message);
    }

    return res.status(201).json({ messages: submission.interactionMessages });
  } catch (error) {
    console.error('Post interaction (teacher) error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Group interactions: get messages (teacher or students who submitted)
router.get('/:taskId/group-interactions', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate('classroom');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role === 'teacher') {
      const teacherId = typeof task.teacher === 'object' && task.teacher !== null ? task.teacher._id : task.teacher;
      if (!teacherId || teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'student') {
      const isStudentInClass = task.classroom.students.some(s => s.toString() === req.user._id.toString());
      if (!isStudentInClass) return res.status(403).json({ message: 'Access denied' });
      // Must have submitted to view group chat
      const mySubmission = (task.submissions || []).find(s => s.student.toString() === req.user._id.toString());
      if (!mySubmission || mySubmission.status !== 'submitted') {
        return res.status(403).json({ message: 'Group chat available after submission' });
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const all = Array.isArray(task.groupInteractionMessages) ? task.groupInteractionMessages : [];
    const MAX = 100;
    const messages = all.length > MAX ? all.slice(all.length - MAX) : all;
    return res.json({ taskId: task._id, messages });
  } catch (error) {
    console.error('Get group interactions error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get group interaction messages for a task (teacher and submitted students only)
router.get('/:taskId/group-interactions', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId)
      .populate('classroom', 'name students')
      .populate('teacher', 'name')
      .populate('groupInteractionMessages.sender', 'name role');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    let allowed = false;
    if (req.user.role === 'teacher') {
      const teacherId = typeof task.teacher === 'object' && task.teacher !== null ? task.teacher._id : task.teacher;
      allowed = teacherId && teacherId.toString() === req.user._id.toString();
    } else if (req.user.role === 'student') {
      const isStudentInClass = task.classroom.students.some(s => s.toString() === req.user._id.toString());
      if (isStudentInClass) {
        const mySubmission = (task.submissions || []).find(s => s.student.toString() === req.user._id.toString());
        allowed = !!mySubmission && mySubmission.status === 'submitted';
      }
    }
    
    if (!allowed) {
      return res.status(403).json({ 
        message: req.user.role === 'student' 
          ? 'You must submit this task before participating in group discussions' 
          : 'Access denied' 
      });
    }

    // Get submitted students for the interaction
    const submittedStudents = task.submissions
      .filter(sub => sub.status === 'submitted')
      .map(sub => sub.student);

    const messages = (task.groupInteractionMessages || []).map(msg => ({
      _id: msg._id,
      sender: {
        _id: msg.sender._id,
        name: msg.sender.name,
        role: msg.sender.role
      },
      senderRole: msg.senderRole,
      message: msg.message,
      createdAt: msg.createdAt
    }));

    return res.json({
      taskId: task._id,
      taskTitle: task.title,
      teacher: {
        _id: task.teacher._id,
        name: task.teacher.name
      },
      submittedStudents: submittedStudents.length,
      messages: messages
    });
  } catch (error) {
    console.error('Get group interactions error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Group interactions: post message with optional file attachments (teacher or submitted student)
router.post('/:taskId/group-interactions', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message } = req.body;
    
    // Message is optional if there are attachments
    if ((!message || !message.trim()) && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Message or attachment is required' });
    }

    const task = await Task.findById(taskId).populate('classroom').populate('teacher', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    let allowed = false;
    let senderRole = req.user.role;
    if (req.user.role === 'teacher') {
      const teacherId = typeof task.teacher === 'object' && task.teacher !== null ? task.teacher._id : task.teacher;
      allowed = teacherId && teacherId.toString() === req.user._id.toString();
    } else if (req.user.role === 'student') {
      const isStudentInClass = task.classroom.students.some(s => s.toString() === req.user._id.toString());
      if (isStudentInClass) {
        const mySubmission = (task.submissions || []).find(s => s.student.toString() === req.user._id.toString());
        allowed = !!mySubmission && mySubmission.status === 'submitted';
      }
    }
    if (!allowed) {
      return res.status(403).json({ 
        message: req.user.role === 'student' 
          ? 'You must submit this task before participating in group discussions' 
          : 'Access denied' 
      });
    }

    // Process uploaded files
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Save file info to File collection
        const fileDoc = new File({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          uploadedBy: req.user._id,
          uploadedAt: new Date()
        });
        await fileDoc.save();

        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date()
        });
      }
    }

    const newMessage = {
      sender: req.user._id,
      senderRole,
      message: message ? message.trim() : '',
      attachments: attachments,
      createdAt: new Date()
    };

    task.groupInteractionMessages = task.groupInteractionMessages || [];
    task.groupInteractionMessages.push(newMessage);
    await task.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user._id,
        role: req.user.role,
        action: 'task_group_interaction_post',
        resourceType: 'task',
        resourceId: task._id.toString(),
        metadata: { 
          messagePreview: newMessage.message.slice(0, 100),
          hasAttachments: attachments.length > 0,
          attachmentCount: attachments.length
        }
      });
    } catch (e) {
      console.error('Activity log error:', e.message);
    }

    // Notify all submitted students (if teacher posted) or teacher (if student posted)
    try {
      const notificationMessage = attachments.length > 0 
        ? `${req.user.name} shared ${attachments.length} file(s) in "${task.title}"`
        : `${req.user.name} posted a message in "${task.title}"`;

      if (req.user.role === 'teacher') {
        // Notify all submitted students
        const submittedStudents = task.submissions
          .filter(sub => sub.status === 'submitted')
          .map(sub => sub.student);
        
        for (const studentId of submittedStudents) {
          const notification = new Notification({
            recipient: studentId,
            sender: req.user._id,
            type: 'task',
            title: 'New Group Message',
            message: notificationMessage,
            data: { taskId: task._id, type: 'group_interaction' }
          });
          await notification.save();
        }
      } else {
        // Notify teacher
        const notification = new Notification({
          recipient: task.teacher,
          sender: req.user._id,
          type: 'task',
          title: 'New Group Message',
          message: notificationMessage,
          data: { taskId: task._id, type: 'group_interaction' }
        });
        await notification.save();
      }
    } catch (e) {
      console.error('Notification error:', e.message);
    }

    // Return the new message with populated sender info
    const populatedMessage = {
      ...newMessage,
      sender: {
        _id: req.user._id,
        name: req.user.name,
        role: req.user.role
      }
    };

    return res.status(201).json({ message: populatedMessage });
  } catch (error) {
    console.error('Post group interaction error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get group interaction attachment file
router.get('/:taskId/group-interactions/:messageId/attachments/:attachmentId/:action(preview|download)', auth, async (req, res) => {
  try {
    const { taskId, messageId, attachmentId, action } = req.params;
    const task = await Task.findById(taskId);
    
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Find the message and attachment
    const message = task.groupInteractionMessages.id(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const attachment = message.attachments.id(attachmentId);
    if (!attachment) return res.status(404).json({ message: 'Attachment not found' });

    // Check access permissions
    let allowed = false;
    if (req.user.role === 'teacher') {
      const teacherId = typeof task.teacher === 'object' && task.teacher !== null ? task.teacher._id : task.teacher;
      allowed = teacherId && teacherId.toString() === req.user._id.toString();
    } else if (req.user.role === 'student') {
      const isStudentInClass = task.classroom.students.some(s => s.toString() === req.user._id.toString());
      if (isStudentInClass) {
        const mySubmission = (task.submissions || []).find(s => s.student.toString() === req.user._id.toString());
        allowed = !!mySubmission && mySubmission.status === 'submitted';
      }
    }

    if (!allowed) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set appropriate headers
    const filename = attachment.originalName || attachment.filename;
    if (action === 'download') {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    }
    res.setHeader('Content-Type', attachment.mimetype || 'application/octet-stream');

    // Stream the file
    const fileStream = fs.createReadStream(attachment.path);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error reading file' });
      }
    });

  } catch (error) {
    console.error('Get group interaction attachment error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Simple file access for teachers (bypasses submission check)
router.get('/:taskId/files/:fileId/:action(preview|download)', auth, async (req, res) => {
  try {
    const { taskId, fileId, action } = req.params;
    const task = await Task.findById(taskId).populate('classroom').populate('teacher', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Only teachers who own the task can access files this way
    const teacherId = typeof task.teacher === 'object' && task.teacher !== null ? task.teacher._id : task.teacher;
    const isTeacher = req.user.role === 'teacher' && teacherId && teacherId.toString() === req.user._id.toString();
    if (!isTeacher) return res.status(403).json({ message: 'Access denied' });

    // Get file from File collection
    const fileDoc = await File.findById(fileId);
    if (!fileDoc) return res.status(404).json({ message: 'File not found' });

    // Verify the file belongs to this task
    if (fileDoc.taskId.toString() !== taskId) {
      return res.status(403).json({ message: 'File does not belong to this task' });
    }

    const filePath = path.resolve(fileDoc.path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing on server' });

    if (action === 'preview') {
      res.setHeader('Content-Type', fileDoc.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${fileDoc.originalName || fileDoc.filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    } else {
      return res.download(filePath, fileDoc.originalName || fileDoc.filename);
    }
  } catch (error) {
    console.error('Simple file access error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Direct file access by file ID for teachers (for submission files)
// Place this before any route that could match '/:id' to avoid conflicts
router.get('/files/:fileId/:action(preview|download)', auth, async (req, res) => {
  try {
    const { fileId, action } = req.params;
    
    // Get file from File collection
    const fileDoc = await File.findById(fileId);
    if (!fileDoc) return res.status(404).json({ message: 'File not found' });

    // Get the task to check teacher ownership
    const task = await Task.findById(fileDoc.taskId).populate('teacher', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Only teachers who own the task can access files this way
    const teacherId = typeof task.teacher === 'object' && task.teacher !== null ? task.teacher._id : task.teacher;
    const isTeacher = req.user.role === 'teacher' && teacherId && teacherId.toString() === req.user._id.toString();
    if (!isTeacher) return res.status(403).json({ message: 'Access denied' });

    const filePath = path.resolve(fileDoc.path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing on server' });

    if (action === 'preview') {
      res.setHeader('Content-Type', fileDoc.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${fileDoc.originalName || fileDoc.filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    } else {
      return res.download(filePath, fileDoc.originalName || fileDoc.filename);
    }
  } catch (error) {
    console.error('Direct file access error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;