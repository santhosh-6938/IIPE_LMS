const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Task = require('../models/Task');
const { sendTeacherWelcomeEmail } = require('../services/emailService');
const { isEmailConfigured } = require('../services/emailService');

// helper to generate 8-char random password
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$!%*?&';
  let pwd = '';
  for (let i = 0; i < 8; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

// Create teacher
const createTeacher = async (req, res) => {
  try {
    const { name, email, password, rollNumber } = req.body;

    // Check if user already exists by email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if roll number already exists (if provided)
    if (rollNumber) {
      const existingUserByRoll = await User.findOne({ rollNumber: rollNumber.toUpperCase() });
      if (existingUserByRoll) {
        return res.status(400).json({ message: 'User with this roll number already exists' });
      }
    }

    // Use provided password or auto-generate 8-char
    const tempPassword = password && password.length >= 8 ? password : generateTempPassword();

    // Create teacher
    const teacherData = {
      name,
      email,
      password: tempPassword,
      role: 'teacher',
      createdBy: req.user._id,
      updatedBy: req.user._id,
      isFirstLogin: true
    };

    // Add roll number if provided
    if (rollNumber) {
      teacherData.rollNumber = rollNumber.toUpperCase();
    }

    const teacher = new User(teacherData);
    await teacher.save();

    // Send welcome email with credentials (if email configured)
    try {
      await sendTeacherWelcomeEmail(teacher.email, teacher.name, tempPassword, req.user?.name || 'Admin');
    } catch (e) {
      console.warn('Teacher welcome email failed:', e.message);
    }

    res.status(201).json({
      message: 'Teacher created successfully and credentials emailed',
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        rollNumber: teacher.rollNumber,
        role: teacher.role,
        isFirstLogin: teacher.isFirstLogin
      },
      generatedPassword: password ? undefined : tempPassword
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    // Get total count
    const totalUsers = await User.countDocuments(query);
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / parseInt(limit));
    
    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit),
        totalUsers
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive, rollNumber } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUserByEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
    }

    // Check if roll number is being changed and if it already exists
    if (rollNumber && rollNumber !== user.rollNumber) {
      const existingUserByRoll = await User.findOne({ 
        rollNumber: rollNumber.toUpperCase(), 
        _id: { $ne: userId } 
      });
      if (existingUserByRoll) {
        return res.status(400).json({ message: 'User with this roll number already exists' });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (rollNumber !== undefined) {
      user.rollNumber = rollNumber ? rollNumber.toUpperCase() : null;
    }
    
    user.updatedBy = req.user._id;
    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of ANY admin account (no admin can delete another admin)
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be deleted' });
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Get counts for other entities
    const totalClassrooms = await Classroom.countDocuments();
    const totalTasks = await Task.countDocuments();
    const totalCourseContent = 0; // Placeholder - implement when CourseContent model is available

    const recentUsers = await User.find({})
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentClassrooms = await Classroom.find({})
      .populate('teacher', 'name')
      .select('name teacher createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      statistics: {
        users: {
          total: totalUsers,
          students: totalStudents,
          teachers: totalTeachers,
          admins: totalAdmins,
          active: activeUsers
        },
        content: {
          classrooms: totalClassrooms,
          tasks: totalTasks,
          courseContent: totalCourseContent
        }
      },
      recent: {
        users: recentUsers,
        classrooms: recentClassrooms
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get statistics (alias for dashboard stats)
const getStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Get counts for other entities
    const totalClassrooms = await Classroom.countDocuments();
    const totalTasks = await Task.countDocuments();
    const totalCourseContent = 0; // Placeholder - implement when CourseContent model is available

    const recentUsers = await User.find({})
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentClassrooms = await Classroom.find({})
      .populate('teacher', 'name')
      .select('name teacher createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      statistics: {
        users: {
          total: totalUsers,
          students: totalStudents,
          teachers: totalTeachers,
          admins: totalAdmins,
          active: activeUsers
        },
        content: {
          classrooms: totalClassrooms,
          tasks: totalTasks,
          courseContent: totalCourseContent
        }
      },
      recent: {
        users: recentUsers,
        classrooms: recentClassrooms
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get classrooms with pagination
const getClassrooms = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count
    const totalClassrooms = await Classroom.countDocuments();
    
    // Get classrooms with pagination
    const classrooms = await Classroom.find({})
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate pagination info
    const totalPages = Math.ceil(totalClassrooms / parseInt(limit));
    
    res.json({
      classrooms,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit),
        totalClassrooms
      }
    });
  } catch (error) {
    console.error('Get classrooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tasks with pagination
const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count
    const totalTasks = await Task.countDocuments();
    
    // Get tasks with pagination
    const tasks = await Task.find({})
      .populate('teacher', 'name email')
      .populate('classroom', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate pagination info
    const totalPages = Math.ceil(totalTasks / parseInt(limit));
    
    res.json({
      tasks,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit),
        totalTasks
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get teacher activity monitoring
const getTeacherActivity = async (req, res) => {
  try {
    const { days = 30, teacherId } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Build query for date filtering
    const dateQuery = { createdAt: { $gte: daysAgo } };
    
    // Build query for teacher filtering
    let teacherQuery = {};
    if (teacherId) {
      teacherQuery.teacher = teacherId;
    }

    // Get classrooms created by teachers
    const classrooms = await Classroom.find({
      ...dateQuery,
      ...teacherQuery
    })
      .populate('teacher', 'name email')
      .select('name subject teacher createdAt')
      .sort({ createdAt: -1 });

    // Get tasks assigned by teachers
    const tasks = await Task.find({
      ...dateQuery,
      ...teacherQuery
    })
      .populate('teacher', 'name email')
      .populate('classroom', 'name')
      .select('title classroom teacher createdAt')
      .sort({ createdAt: -1 });

    // Get course content uploaded by teachers
    const CourseContent = require('../models/CourseContent');
    let courseContentQuery = { ...dateQuery };
    
    if (teacherId) {
      // If filtering by specific teacher, get content from their classrooms
      const teacherClassrooms = await Classroom.find({ teacher: teacherId }).select('_id');
      const classroomIds = teacherClassrooms.map(c => c._id);
      courseContentQuery.classroom = { $in: classroomIds };
    }
    
    const courseContent = await CourseContent.find(courseContentQuery)
      .populate('classroom', 'name')
      .populate('uploadedBy', 'name email')
      .select('title type classroom uploadedBy createdAt')
      .sort({ createdAt: -1 });

    res.json({
      classrooms,
      tasks,
      courseContent,
      period: {
        days: parseInt(days),
        from: daysAgo,
        to: new Date()
      }
    });
  } catch (error) {
    console.error('Get teacher activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTeacher,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  getStatistics,
  getClassrooms,
  getTasks,
  getTeacherActivity,
  getEmailConfig: async (req, res) => {
    try {
      return res.json({ emailConfigured: !!isEmailConfigured() });
    } catch (e) {
      return res.json({ emailConfigured: false });
    }
  }
};
