const express = require('express');
const Attendance = require('../models/Attendance');
const Classroom = require('../models/Classroom');
const { auth } = require('../middleware/auth');
const ExcelJS = require('exceljs');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get attendance for a specific classroom and date
router.get('/classroom/:classroomId', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { date } = req.query;

    // Check if user has access to this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
  if (classroom.isArchived) {
    return res.status(400).json({ message: 'Attendance is not available for archived classrooms' });
  }

    // Only teacher of the classroom can access attendance
    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Normalize date in local timezone to ensure today's record is found/created
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      classroom: classroomId,
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('records.student', 'name email').populate('records.markedBy', 'name');

    // If no attendance record exists for the date, create one with default present status
    if (!attendance) {
      const students = await Classroom.findById(classroomId).populate('students', 'name email');
      
      attendance = new Attendance({
        classroom: classroomId,
        date: targetDate,
        totalStudents: students.students.length,
        records: students.students.map(student => ({
          student: student._id,
          status: 'present',
          markedBy: req.user._id
        }))
      });

      await attendance.save();
      attendance = await attendance.populate('records.student', 'name email');
      attendance = await attendance.populate('records.markedBy', 'name');
    } else {
      // If an attendance record exists for the date, ensure any newly added students are included
      // Only update if not frozen
      if (!attendance.isFrozen) {
        const classroomWithStudents = await Classroom.findById(classroomId).populate('students', 'name email');
        const currentStudentIds = new Set(attendance.records.map(r => r.student && r.student._id ? r.student._id.toString() : r.student.toString()));
        const newStudentRecords = [];

        for (const student of classroomWithStudents.students) {
          const studentIdStr = student._id.toString();
          if (!currentStudentIds.has(studentIdStr)) {
            newStudentRecords.push({
              student: student._id,
              status: 'present',
              markedBy: req.user._id,
              markedAt: new Date()
            });
          }
        }

        if (newStudentRecords.length > 0) {
          attendance.records.push(...newStudentRecords);
          attendance.totalStudents = classroomWithStudents.students.length;
          attendance.updateCounts();
          await attendance.save();
          attendance = await attendance.populate('records.student', 'name email');
          attendance = await attendance.populate('records.markedBy', 'name');
        }
      }
    }

    // Auto-freeze attendance for past dates
    if (targetDate < today && !attendance.isFrozen) {
      attendance.isFrozen = true;
      attendance.frozenAt = new Date();
      await attendance.save();
      attendance = await attendance.populate('records.student', 'name email');
      attendance = await attendance.populate('records.markedBy', 'name');
    }

    res.json({ attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update attendance for a student
router.put('/classroom/:classroomId/student/:studentId', async (req, res) => {
  try {
    const { classroomId, studentId } = req.params;
    const { status, date, notes } = req.body;

    // Check if user has access to this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
  if (classroom.isArchived) {
    return res.status(400).json({ message: 'Cannot update attendance for archived classrooms' });
  }

    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      classroom: classroomId,
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found for this date' });
    }

    if (attendance.isFrozen) {
      return res.status(400).json({ message: 'Attendance is frozen and cannot be edited' });
    }

    // Update the specific student's attendance
    const recordIndex = attendance.records.findIndex(
      record => record.student.toString() === studentId
    );

    if (recordIndex === -1) {
      return res.status(404).json({ message: 'Student not found in attendance record' });
    }

    attendance.records[recordIndex].status = status;
    attendance.records[recordIndex].markedBy = req.user._id;
    attendance.records[recordIndex].markedAt = new Date();
    if (notes !== undefined) {
      attendance.records[recordIndex].notes = notes;
    }

    // Update counts
    attendance.updateCounts();
    await attendance.save();

    // Populate and return updated attendance
    attendance = await attendance.populate('records.student', 'name email');
    attendance = await attendance.populate('records.markedBy', 'name');

    res.json({ 
      message: 'Attendance updated successfully',
      attendance 
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Freeze attendance for a classroom and date (prevent edits)
router.post('/classroom/:classroomId/freeze', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { date } = req.body;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
  if (classroom.isArchived) return res.status(400).json({ message: 'Cannot freeze attendance for archived classrooms' });
    if (classroom.teacher.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied' });

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      classroom: classroomId,
      date: { $gte: targetDate, $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (!attendance) return res.status(404).json({ message: 'Attendance record not found for this date' });

    attendance.isFrozen = true;
    attendance.frozenAt = new Date();
    await attendance.save();

    // Populate before returning so client has student details
    attendance = await attendance.populate('records.student', 'name email');
    attendance = await attendance.populate('records.markedBy', 'name');

    res.json({ message: 'Attendance frozen', attendance });
  } catch (error) {
    console.error('Freeze attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unfreeze attendance for a classroom and date (allow edits)
router.post('/classroom/:classroomId/unfreeze', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { date } = req.body;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
  if (classroom.isArchived) return res.status(400).json({ message: 'Cannot unfreeze attendance for archived classrooms' });
    if (classroom.teacher.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied' });

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      classroom: classroomId,
      date: { $gte: targetDate, $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (!attendance) return res.status(404).json({ message: 'Attendance record not found for this date' });

    attendance.isFrozen = false;
    attendance.frozenAt = null;
    await attendance.save();

    // Populate before returning so client has student details
    attendance = await attendance.populate('records.student', 'name email');
    attendance = await attendance.populate('records.markedBy', 'name');

    res.json({ message: 'Attendance unfrozen', attendance });
  } catch (error) {
    console.error('Unfreeze attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance history for a classroom
router.get('/classroom/:classroomId/history', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    // Check if user has access to this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { classroom: classroomId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;

    const attendance = await Attendance.find(query)
      .populate('records.student', 'name email')
      .populate('records.markedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student attendance summary
router.get('/classroom/:classroomId/student/:studentId/summary', async (req, res) => {
  try {
    const { classroomId, studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user has access to this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await Attendance.getStudentAttendanceSummary(classroomId, studentId, start, end);

    const result = summary[0] || {
      totalClasses: 0,
      presentCount: 0,
      absentCount: 0
    };

    result.attendancePercentage = result.totalClasses > 0 
      ? Math.round((result.presentCount / result.totalClasses) * 100) 
      : 0;

    res.json({ summary: result });
  } catch (error) {
    console.error('Get student attendance summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance statistics for a classroom
router.get('/classroom/:classroomId/statistics', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user has access to this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const attendance = await Attendance.find({
      classroom: classroomId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    // Calculate statistics
    const totalClasses = attendance.length;
    const totalPresent = attendance.reduce((sum, record) => sum + record.presentCount, 0);
    const totalAbsent = attendance.reduce((sum, record) => sum + record.absentCount, 0);
    const averageAttendance = totalClasses > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0;

    // Daily attendance data for charts
    const dailyData = attendance.map(record => ({
      date: record.date,
      present: record.presentCount,
      absent: record.absentCount,
      total: record.totalStudents,
      percentage: record.attendancePercentage
    }));

    res.json({
      statistics: {
        totalClasses,
        totalPresent,
        totalAbsent,
        averageAttendance,
        startDate: start,
        endDate: end
      },
      dailyData
    });
  } catch (error) {
    console.error('Get attendance statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download weekly attendance report
router.get('/classroom/:classroomId/download', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user has access to this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();

    const attendance = await Attendance.find({
      classroom: classroomId,
      date: { $gte: start, $lte: end }
    }).populate('records.student', 'name email').populate('records.markedBy', 'name').sort({ date: 1 });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Add headers
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Student Name', key: 'studentName', width: 25 },
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
          studentName: record.student.name,
          email: record.student.email,
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
    res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${classroom.name}-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Download attendance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's own attendance (for students)
router.get('/student/summary', async (req, res) => {
  try {
    const { classroomId, startDate, endDate } = req.query;

    if (!classroomId) {
      return res.status(400).json({ message: 'Classroom ID is required' });
    }

    // Validate ObjectId format to avoid cast errors in aggregation
    const isValidId = require('mongoose').Types.ObjectId.isValid(classroomId);
    if (!isValidId) {
      return res.status(400).json({ message: 'Invalid classroom ID' });
    }

    // Check if student is enrolled in this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (!Array.isArray(classroom.students) || !classroom.students.some(id => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // Compute summary without aggregation to avoid ObjectId/aggregation pitfalls
    const studentIdStr = req.user._id.toString();
    const attendanceDocs = await Attendance.find({
      classroom: classroomId,
      date: { $gte: start, $lte: end }
    }).select('records').lean();

    let totalClasses = 0;
    let presentCount = 0;
    let absentCount = 0;

    for (const doc of attendanceDocs) {
      if (!Array.isArray(doc.records)) continue;
      const rec = doc.records.find(r => r && r.student && r.student.toString() === studentIdStr);
      if (rec) {
        totalClasses += 1;
        if (rec.status === 'present') presentCount += 1;
        if (rec.status === 'absent') absentCount += 1;
      }
    }

    const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
    res.json({ summary: { totalClasses, presentCount, absentCount, attendancePercentage } });
  } catch (error) {
    console.error('Get student attendance summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes for viewing all student attendance
// Get all student attendance for admin
router.get('/admin/all-students', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;

    const attendance = await Attendance.find(query)
      .populate('classroom', 'name')
      .populate('records.student', 'name email')
      .populate('records.markedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Get all student attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all student attendance statistics for admin
router.get('/admin/statistics', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const attendance = await Attendance.find({
      date: { $gte: start, $lte: end }
    }).populate('classroom', 'name').sort({ date: 1 });

    // Calculate statistics
    const totalClasses = attendance.length;
    const totalPresent = attendance.reduce((sum, record) => sum + record.presentCount, 0);
    const totalAbsent = attendance.reduce((sum, record) => sum + record.absentCount, 0);
    const averageAttendance = totalClasses > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0;

    // Daily attendance data for charts
    const dailyData = attendance.map(record => ({
      date: record.date,
      present: record.presentCount,
      absent: record.absentCount,
      total: record.totalStudents,
      percentage: record.attendancePercentage,
      classroom: record.classroom.name
    }));

    res.json({
      statistics: {
        totalClasses,
        totalPresent,
        totalAbsent,
        averageAttendance,
        startDate: start,
        endDate: end
      },
      dailyData
    });
  } catch (error) {
    console.error('Get all student attendance statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download all student attendance report for admin
router.get('/admin/download', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();

    const attendance = await Attendance.find({
      date: { $gte: start, $lte: end }
    }).populate('classroom', 'name').populate('records.student', 'name email').populate('records.markedBy', 'name').sort({ date: 1 });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('All Student Attendance Report');

    // Add headers
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Classroom', key: 'classroom', width: 20 },
      { header: 'Student Name', key: 'studentName', width: 25 },
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
          classroom: dayRecord.classroom.name,
          studentName: record.student.name,
          email: record.student.email,
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
    res.setHeader('Content-Disposition', `attachment; filename=all-student-attendance-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Download all student attendance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
