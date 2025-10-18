const MidTermMarks = require('../models/MidTermMarks');
const TaskMarks = require('../models/TaskMarks');
const Classroom = require('../models/Classroom');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const xlsx = require('xlsx');

// Helper function to parse Excel file
const parseExcelFile = (buffer) => {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    return data.map(row => ({
      name: row['Name'] || row['name'] || '',
      email: row['Email ID'] || row['email'] || row['Email'] || '',
      rollNumber: row['Roll Number'] || row['rollNumber'] || row['Roll Number'] || '',
      marks: parseInt(row['Marks'] || row['marks']) || 0
    }));
  } catch (error) {
    throw new Error('Invalid Excel file format');
  }
};

// Mid Term Marks Controllers

// Get mid term marks for a classroom
const getMidTermMarks = async (req, res) => {
  try {
    const { classroomId, term, academicYear, semester } = req.query;
    
    let query = { teacher: req.user._id };
    if (classroomId) query.classroom = classroomId;
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const marks = await MidTermMarks.find(query)
      .populate('classroom', 'name')
      .populate('marks.student', 'name email rollNumber')
      .sort({ createdAt: -1 });

    res.json(marks);
  } catch (error) {
    console.error('Get mid term marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create mid term marks (draft)
const createMidTermMarks = async (req, res) => {
  try {
    const { classroomId, term, academicYear, semester, subject, marksData } = req.body;

    // Verify teacher owns the classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if marks already exist for this term
    const existingMarks = await MidTermMarks.findOne({
      classroom: classroomId,
      term,
      academicYear,
      semester
    });

    if (existingMarks) {
      return res.status(400).json({ message: 'Marks already exist for this term' });
    }

    // Validate marks data
    const validatedMarks = marksData.map(mark => ({
      student: mark.student,
      marks: Math.max(0, Math.min(100, parseInt(mark.marks) || 0)),
      remarks: mark.remarks || ''
    }));

    console.log('Creating mid-term marks with data:', JSON.stringify(validatedMarks, null, 2));

    const midTermMarks = new MidTermMarks({
      classroom: classroomId,
      teacher: req.user._id,
      term,
      academicYear,
      semester,
      subject,
      marks: validatedMarks,
      createdBy: req.user._id
    });

    await midTermMarks.save();
    await midTermMarks.populate('marks.student', 'name email rollNumber');

    res.status(201).json(midTermMarks);
  } catch (error) {
    console.error('Create mid term marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload mid term marks from Excel
const uploadMidTermMarks = async (req, res) => {
  try {
    const { classroomId, term, academicYear, semester, subject } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Excel file is required' });
    }

    // Verify teacher owns the classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Parse Excel file
    const excelData = parseExcelFile(req.file.buffer);
    
    // Get students from classroom
    const students = await User.find({ 
      _id: { $in: classroom.students },
      role: 'student'
    });

    // Match Excel data with students
    const marksData = excelData.map(row => {
      const student = students.find(s => 
        s.email.toLowerCase() === row.email.toLowerCase() ||
        s.rollNumber === row.rollNumber ||
        s.name.toLowerCase() === row.name.toLowerCase()
      );

      if (!student) {
        throw new Error(`Student not found: ${row.name || row.email || row.rollNumber}`);
      }

      return {
        student: student._id,
        marks: Math.max(0, Math.min(100, row.marks)),
        remarks: ''
      };
    });

    // Check if marks already exist for this term
    const existingMarks = await MidTermMarks.findOne({
      classroom: classroomId,
      term,
      academicYear,
      semester
    });

    if (existingMarks) {
      return res.status(400).json({ message: 'Marks already exist for this term' });
    }

    const midTermMarks = new MidTermMarks({
      classroom: classroomId,
      teacher: req.user._id,
      term,
      academicYear,
      semester,
      subject,
      marks: marksData,
      createdBy: req.user._id
    });

    await midTermMarks.save();
    await midTermMarks.populate('marks.student', 'name email rollNumber');

    res.status(201).json(midTermMarks);
  } catch (error) {
    console.error('Upload mid term marks error:', error);
    if (error.message.includes('Student not found') || error.message.includes('Invalid Excel file')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update mid term marks (only if in draft)
const updateMidTermMarks = async (req, res) => {
  try {
    const { marksId } = req.params;
    const { marksData } = req.body;

    const midTermMarks = await MidTermMarks.findById(marksId);
    if (!midTermMarks) {
      return res.status(404).json({ message: 'Marks not found' });
    }

    if (midTermMarks.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (midTermMarks.status === 'published') {
      return res.status(400).json({ message: 'Cannot edit published marks' });
    }

    // Validate marks data
    const validatedMarks = marksData.map(mark => ({
      student: mark.student,
      marks: Math.max(0, Math.min(100, parseInt(mark.marks) || 0)),
      remarks: mark.remarks || ''
    }));

    console.log('Updating mid-term marks with data:', JSON.stringify(validatedMarks, null, 2));

    midTermMarks.marks = validatedMarks;
    await midTermMarks.save();
    await midTermMarks.populate('marks.student', 'name email rollNumber');

    res.json(midTermMarks);
  } catch (error) {
    console.error('Update mid term marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Publish mid term marks
const publishMidTermMarks = async (req, res) => {
  try {
    const { marksId } = req.params;

    const midTermMarks = await MidTermMarks.findById(marksId);
    if (!midTermMarks) {
      return res.status(404).json({ message: 'Marks not found' });
    }

    if (midTermMarks.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (midTermMarks.status === 'published') {
      return res.status(400).json({ message: 'Marks already published' });
    }

    midTermMarks.status = 'published';
    midTermMarks.publishedAt = new Date();
    midTermMarks.publishedBy = req.user._id;

    await midTermMarks.save();

    // Create notifications for students
    const notifications = midTermMarks.marks.map(mark => ({
      recipient: mark.student,
      sender: req.user._id,
      type: 'marks',
      title: `${midTermMarks.term} Marks Published`,
      message: `Your ${midTermMarks.term} marks for ${midTermMarks.subject} have been published`,
      data: {
        marksId: midTermMarks._id,
        term: midTermMarks.term,
        subject: midTermMarks.subject,
        marks: mark.marks
      }
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ message: 'Marks published successfully', marks: midTermMarks });
  } catch (error) {
    console.error('Publish mid term marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get published mid term marks for students
const getStudentMidTermMarks = async (req, res) => {
  try {
    const { term, academicYear, semester } = req.query;

    // Get student's classrooms
    const classrooms = await Classroom.find({ students: req.user._id });
    const classroomIds = classrooms.map(c => c._id);

    let query = {
      classroom: { $in: classroomIds },
      status: 'published'
    };
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const marks = await MidTermMarks.find(query)
      .populate('classroom', 'name')
      .populate('teacher', 'name')
      .select('term academicYear semester subject marks publishedAt');

    // Filter to only include the current student's marks
    const studentMarks = marks.map(mark => ({
      ...mark.toObject(),
      marks: mark.marks.filter(m => m.student.toString() === req.user._id.toString())
    })).filter(mark => mark.marks.length > 0);

    console.log('Student marks data:', JSON.stringify(studentMarks, null, 2));
    res.json(studentMarks);
  } catch (error) {
    console.error('Get student mid term marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Task Marks Controllers

// Get task marks for a task
const getTaskMarks = async (req, res) => {
  try {
    const { taskId } = req.params;

    const taskMarks = await TaskMarks.findOne({ task: taskId, teacher: req.user._id })
      .populate('task', 'title')
      .populate('marks.student', 'name email rollNumber');

    res.json(taskMarks);
  } catch (error) {
    console.error('Get task marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create or update task marks
const updateTaskMarks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { marksData } = req.body;

    // Verify task exists and teacher owns it
    const task = await Task.findById(taskId).populate('classroom');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find or create task marks
    let taskMarks = await TaskMarks.findOne({ task: taskId, teacher: req.user._id });

    if (!taskMarks) {
      taskMarks = new TaskMarks({
        task: taskId,
        classroom: task.classroom._id,
        teacher: req.user._id,
        createdBy: req.user._id
      });
    }

    // Validate marks data
    const validatedMarks = marksData.map(mark => ({
      student: mark.student._id || mark.student, // Handle both object and ID
      submission: mark.submission,
      marks: Math.max(0, Math.min(100, parseInt(mark.marks) || 0)),
      feedback: mark.feedback || '',
      gradedAt: new Date()
    }));

    // Check if marks already exist and update status to draft if needed
    if (taskMarks.status === 'published') {
      return res.status(400).json({ message: 'Cannot edit published marks' });
    }

    console.log('Updating task marks with data:', JSON.stringify(validatedMarks, null, 2));

    taskMarks.marks = validatedMarks;
    await taskMarks.save();
    await taskMarks.populate('marks.student', 'name email rollNumber');

    res.json(taskMarks);
  } catch (error) {
    console.error('Update task marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Publish task marks
const publishTaskMarks = async (req, res) => {
  try {
    const { taskId } = req.params;

    const taskMarks = await TaskMarks.findOne({ task: taskId, teacher: req.user._id });
    if (!taskMarks) {
      return res.status(404).json({ message: 'Task marks not found' });
    }

    if (taskMarks.status === 'published') {
      return res.status(400).json({ message: 'Task marks already published' });
    }

    taskMarks.status = 'published';
    taskMarks.publishedAt = new Date();
    taskMarks.publishedBy = req.user._id;

    await taskMarks.save();

    // Create notifications for students
    const notifications = taskMarks.marks.map(mark => ({
      recipient: mark.student,
      sender: req.user._id,
      type: 'marks',
      title: 'Task Marks Published',
      message: `Your marks for task have been published`,
      data: {
        taskId: taskMarks.task,
        marks: mark.marks,
        feedback: mark.feedback
      }
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ message: 'Task marks published successfully', marks: taskMarks });
  } catch (error) {
    console.error('Publish task marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student's published task marks
const getStudentTaskMarks = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify student has access to this task
    const task = await Task.findById(taskId).populate('classroom');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isStudentInClass = task.classroom.students.some(
      studentId => studentId.toString() === req.user._id.toString()
    );

    if (!isStudentInClass) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const taskMarks = await TaskMarks.findOne({ 
      task: taskId, 
      status: 'published' 
    }).populate('task', 'title');

    if (!taskMarks) {
      return res.json(null);
    }

    // Filter to only include the current student's marks
    const studentMark = taskMarks.marks.find(
      mark => mark.student.toString() === req.user._id.toString()
    );

    res.json({
      ...taskMarks.toObject(),
      marks: studentMark ? [studentMark] : []
    });
  } catch (error) {
    console.error('Get student task marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // Mid Term Marks
  getMidTermMarks,
  createMidTermMarks,
  uploadMidTermMarks,
  updateMidTermMarks,
  publishMidTermMarks,
  getStudentMidTermMarks,
  
  // Task Marks
  getTaskMarks,
  updateTaskMarks,
  publishTaskMarks,
  getStudentTaskMarks
};
