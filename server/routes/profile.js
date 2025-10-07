const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Attendance = require('../models/Attendance');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'teacher') {
      const classrooms = await Classroom.find({ teacher: user._id }).sort({ createdAt: -1 }).lean();
      const activeClassrooms = classrooms.filter(c => !c.isArchived);
      const archivedClassrooms = classrooms.filter(c => c.isArchived);

      // Compute attendance percentages per classroom (average daily attendance)
      const perClass = [];
      let overallNumerator = 0;
      let overallDenominator = 0;
      for (const cls of classrooms) {
        const records = await Attendance.find({ classroom: cls._id }).select('presentCount totalStudents').lean();
        if (records.length === 0) {
          perClass.push({ classroomId: cls._id, classroomName: cls.name, percentage: 0, totalClasses: 0 });
          continue;
        }
        let sumPct = 0;
        for (const r of records) {
          const denom = Math.max(1, r.totalStudents || 0);
          sumPct += Math.round((r.presentCount / denom) * 100);
        }
        const avg = Math.round(sumPct / records.length);
        perClass.push({ classroomId: cls._id, classroomName: cls.name, percentage: avg, totalClasses: records.length });
        overallNumerator += avg * records.length;
        overallDenominator += records.length;
      }
      const overall = overallDenominator > 0 ? Math.round(overallNumerator / overallDenominator) : 0;

      return res.json({
        user,
        role: 'teacher',
        classrooms: { active: activeClassrooms, archived: archivedClassrooms },
        attendanceOverview: { overallPercentage: overall, perClassroom: perClass }
      });
    }

    // student
    const classrooms = await Classroom.find({ students: user._id }).sort({ createdAt: -1 }).lean();
    const activeClassrooms = classrooms.filter(c => !c.isArchived);
    const archivedClassrooms = classrooms.filter(c => c.isArchived);

    const perClass = [];
    let presentSum = 0;
    let totalClassesSum = 0;
    for (const cls of classrooms) {
      const records = await Attendance.find({ classroom: cls._id }).select('records').lean();
      let total = 0;
      let present = 0;
      for (const rec of records) {
        total += 1;
        const entry = (rec.records || []).find(r => r && r.student && r.student.toString() === user._id.toString());
        if (entry && entry.status === 'present') present += 1;
      }
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      perClass.push({ classroomId: cls._id, classroomName: cls.name, percentage: pct, totalClasses: total });
      presentSum += present;
      totalClassesSum += total;
    }
    const overall = totalClassesSum > 0 ? Math.round((presentSum / totalClassesSum) * 100) : 0;

    // Calculate profile completion percentage
    const profileFields = ['phone', 'profilePhoto', 'course', 'year', 'semester', 'department', 'dateOfBirth', 'address', 'bio'];
    const completedFields = profileFields.filter(field => {
      if (field === 'address') {
        return user.address && user.address.city && user.address.state;
      }
      return user[field] && user[field] !== null && user[field] !== '';
    }).length;
    const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

    return res.json({
      user,
      role: 'student',
      classrooms: { active: activeClassrooms, archived: archivedClassrooms },
      attendanceOverview: { overallPercentage: overall, perClassroom: perClass },
      profileCompletion
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update profile route
router.put('/update', auth, upload.single('profilePhoto'), async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = { ...req.body };

    // Handle profile photo upload
    if (req.file) {
      updateData.profilePhoto = `uploads/profiles/${req.file.filename}`;
    }

    // Handle address object
    if (updateData.city || updateData.state) {
      updateData.address = {
        city: updateData.city || null,
        state: updateData.state || null
      };
      delete updateData.city;
      delete updateData.state;
    }

    // Handle date of birth
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    // Remove empty strings and convert to null
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === undefined) {
        updateData[key] = null;
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate updated profile completion
    const profileFields = ['phone', 'profilePhoto', 'course', 'year', 'semester', 'department', 'dateOfBirth', 'address', 'bio'];
    const completedFields = profileFields.filter(field => {
      if (field === 'address') {
        return updatedUser.address && updatedUser.address.city && updatedUser.address.state;
      }
      return updatedUser[field] && updatedUser[field] !== null && updatedUser[field] !== '';
    }).length;
    const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
      profileCompletion
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;




