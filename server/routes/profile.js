const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Attendance = require('../models/Attendance');

const router = express.Router();

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

    return res.json({
      user,
      role: 'student',
      classrooms: { active: activeClassrooms, archived: archivedClassrooms },
      attendanceOverview: { overallPercentage: overall, perClassroom: perClass }
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



