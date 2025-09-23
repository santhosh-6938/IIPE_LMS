const express = require('express');
const TeacherAttendance = require('../models/TeacherAttendance');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const ExcelJS = require('exceljs');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Apply admin middleware to all routes
router.use(requireAdmin);

// Get teacher attendance for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let attendance = await TeacherAttendance.findOne({
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('records.teacher', 'name email').populate('records.markedBy', 'name');

    // If no attendance record exists for today, create one with default present status
    if (!attendance) {
      const teachers = await User.find({ role: 'teacher' }).select('name email');
      
      attendance = new TeacherAttendance({
        date: targetDate,
        totalTeachers: teachers.length,
        records: teachers.map(teacher => ({
          teacher: teacher._id,
          status: 'present',
          markedBy: req.user._id
        }))
      });

      await attendance.save();
      attendance = await attendance.populate('records.teacher', 'name email');
      attendance = await attendance.populate('records.markedBy', 'name');
    } else {
      // Ensure the attendance record stays in sync with current teachers
      const teachers = await User.find({ role: 'teacher' }).select('_id');
      const teacherIdSet = new Set(teachers.map(t => t._id.toString()));

      // Existing record teacher ids (populated or not)
      const existingIds = new Set(attendance.records.map(r => (r.teacher?._id || r.teacher)?.toString()));

      // Add missing teachers
      for (const id of teacherIdSet) {
        if (!existingIds.has(id)) {
          attendance.records.push({ teacher: id, status: 'present', markedBy: req.user._id, markedAt: new Date() });
        }
      }

      // Remove records with teachers that no longer exist
      attendance.records = attendance.records.filter(r => {
        const id = (r.teacher?._id || r.teacher)?.toString();
        return id && teacherIdSet.has(id);
      });

      attendance.totalTeachers = attendance.records.length;
      attendance.updateCounts();
      await attendance.save();
      attendance = await attendance.populate('records.teacher', 'name email');
      attendance = await attendance.populate('records.markedBy', 'name');
    }

    res.json({ attendance });
  } catch (error) {
    console.error('Get teacher attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update teacher attendance
router.put('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { status, date, notes } = req.body;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    let attendance = await TeacherAttendance.findOne({
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found for this date' });
    }

    // Update the specific teacher's attendance
    const recordIndex = attendance.records.findIndex(
      record => record.teacher.toString() === teacherId
    );

    if (recordIndex === -1) {
      return res.status(404).json({ message: 'Teacher not found in attendance record' });
    }

    if (attendance.isFrozen) {
      return res.status(400).json({ message: 'Teacher attendance is frozen and cannot be edited' });
    }

    attendance.records[recordIndex].status = status;
    attendance.records[recordIndex].markedBy = req.user._id;
    attendance.records[recordIndex].markedAt = new Date();
    if (notes) {
      attendance.records[recordIndex].notes = notes;
    }

    // Update counts
    attendance.updateCounts();
    await attendance.save();

    // Populate and return updated attendance
    attendance = await attendance.populate('records.teacher', 'name email');
    attendance = await attendance.populate('records.markedBy', 'name');

    res.json({ 
      message: 'Teacher attendance updated successfully',
      attendance 
    });
  } catch (error) {
    console.error('Update teacher attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Freeze teacher attendance for date
router.post('/freeze', async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0,0,0,0);

    let attendance = await TeacherAttendance.findOne({
      date: { $gte: targetDate, $lt: new Date(targetDate.getTime() + 24*60*60*1000) }
    });
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found for this date' });
    attendance.isFrozen = true;
    attendance.frozenAt = new Date();
    await attendance.save();
    attendance = await attendance.populate('records.teacher', 'name email').populate('records.markedBy', 'name');
    res.json({ message: 'Teacher attendance frozen', attendance });
  } catch (error) {
    console.error('Freeze teacher attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unfreeze teacher attendance for date
router.post('/unfreeze', async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0,0,0,0);

    let attendance = await TeacherAttendance.findOne({
      date: { $gte: targetDate, $lt: new Date(targetDate.getTime() + 24*60*60*1000) }
    });
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found for this date' });
    attendance.isFrozen = false;
    attendance.frozenAt = null;
    await attendance.save();
    attendance = await attendance.populate('records.teacher', 'name email').populate('records.markedBy', 'name');
    res.json({ message: 'Teacher attendance unfrozen', attendance });
  } catch (error) {
    console.error('Unfreeze teacher attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teacher attendance history
router.get('/history', async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;

    const attendance = await TeacherAttendance.find(query)
      .populate('records.teacher', 'name email')
      .populate('records.markedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TeacherAttendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Get teacher attendance history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teacher attendance summary
router.get('/teacher/:teacherId/summary', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await TeacherAttendance.getTeacherAttendanceSummary(teacherId, start, end);

    const result = summary[0] || {
      totalDays: 0,
      presentCount: 0,
      absentCount: 0
    };

    result.attendancePercentage = result.totalDays > 0 
      ? Math.round((result.presentCount / result.totalDays) * 100) 
      : 0;

    res.json({ summary: result });
  } catch (error) {
    console.error('Get teacher attendance summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teacher attendance statistics
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const attendance = await TeacherAttendance.find({
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    // Calculate statistics
    const totalDays = attendance.length;
    const totalPresent = attendance.reduce((sum, record) => sum + record.presentCount, 0);
    const totalAbsent = attendance.reduce((sum, record) => sum + record.absentCount, 0);
    const averageAttendance = totalDays > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0;

    // Daily attendance data for charts
    const dailyData = attendance.map(record => ({
      date: record.date,
      present: record.presentCount,
      absent: record.absentCount,
      total: record.totalTeachers,
      percentage: record.attendancePercentage
    }));

    res.json({
      statistics: {
        totalDays,
        totalPresent,
        totalAbsent,
        averageAttendance,
        startDate: start,
        endDate: end
      },
      dailyData
    });
  } catch (error) {
    console.error('Get teacher attendance statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download teacher attendance report
router.get('/download', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();

    const attendance = await TeacherAttendance.find({
      date: { $gte: start, $lte: end }
    }).populate('records.teacher', 'name email').populate('records.markedBy', 'name').sort({ date: 1 });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Teacher Attendance Report');

    // Add headers
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Teacher Name', key: 'teacherName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Marked By', key: 'markedBy', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 }
    ];

    // Add data
    attendance.forEach(dayRecord => {
      dayRecord.records.forEach(record => {
        worksheet.addRow({
          date: dayRecord.date.toLocaleDateString(),
          teacherName: record.teacher.name,
          email: record.teacher.email,
          status: record.status.toUpperCase(),
          markedBy: record.markedBy.name,
          notes: record.notes || ''
        });
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=teacher-attendance-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Download teacher attendance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
