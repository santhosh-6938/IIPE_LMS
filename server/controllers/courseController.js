const Course = require('../models/Course');

// Get subject by course code
const getSubjectByCourseCode = async (req, res) => {
  try {
    const { courseCode } = req.params;
    console.log('🔍 Course Controller - Looking for course code:', courseCode);
    
    const course = await Course.findOne({ 
      courseCode: courseCode.trim(),
      isActive: true 
    });
    
    console.log('🔍 Course Controller - Found course:', course ? `${course.courseCode}: ${course.subject}` : 'Not found');
    
    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found or not available' 
      });
    }
    
    res.json({ 
      courseCode: course.courseCode,
      subject: course.subject,
      program: course.program,
      branch: course.branch,
      semester: course.semester,
      credits: course.credits,
      isAvailableForNextSemester: course.isAvailableForNextSemester
    });
  } catch (error) {
    console.error('Get subject by course code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all courses with filtering options
const getCourses = async (req, res) => {
  try {
    const { 
      program, 
      branch, 
      semester, 
      isAvailableForNextSemester,
      isActive = true 
    } = req.query;
    
    const filter = { isActive };
    
    if (program) filter.program = program;
    if (branch) filter.branch = branch;
    if (semester && semester !== 'Both') filter.semester = { $in: [semester, 'Both'] };
    if (isAvailableForNextSemester !== undefined) {
      filter.isAvailableForNextSemester = isAvailableForNextSemester === 'true';
    }
    
    const courses = await Course.find(filter)
      .sort({ courseCode: 1 })
      .select('-flagHistory');
    
    res.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new course
const createCourse = async (req, res) => {
  try {
    const { courseCode, subject, program, branch, semester, credits, description } = req.body;
    
    // Check if course already exists
    const existingCourse = await Course.findOne({ courseCode });
    if (existingCourse) {
      return res.status(400).json({ 
        message: 'Course with this code already exists' 
      });
    }
    
    const course = new Course({
      courseCode,
      subject,
      program,
      branch,
      semester: semester || 'Both',
      credits: credits || 3,
      description
    });
    
    await course.save();
    
    res.status(201).json({ 
      message: 'Course created successfully',
      course: {
        courseCode: course.courseCode,
        subject: course.subject,
        program: course.program,
        branch: course.branch,
        semester: course.semester,
        credits: course.credits,
        isAvailableForNextSemester: course.isAvailableForNextSemester,
        isActive: course.isActive
      }
    });
  } catch (error) {
    console.error('Create course error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update course availability flag
const updateCourseAvailability = async (req, res) => {
  try {
    const { courseCode } = req.params;
    const { isAvailableForNextSemester, reason } = req.body;
    const userId = req.user.id;
    
    const course = await Course.findOne({ courseCode });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const previousStatus = course.isAvailableForNextSemester;
    course.isAvailableForNextSemester = isAvailableForNextSemester;
    
    // Add to flag history
    course.flagHistory.push({
      action: isAvailableForNextSemester ? 'unflagged' : 'flagged',
      flaggedBy: userId,
      reason: reason || (isAvailableForNextSemester ? 'Made available for next semester' : 'Flagged for next semester')
    });
    
    await course.save();
    
    res.json({ 
      message: `Course ${isAvailableForNextSemester ? 'unflagged' : 'flagged'} successfully`,
      course: {
        courseCode: course.courseCode,
        subject: course.subject,
        isAvailableForNextSemester: course.isAvailableForNextSemester,
        previousStatus
      }
    });
  } catch (error) {
    console.error('Update course availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get course flag history
const getCourseFlagHistory = async (req, res) => {
  try {
    const { courseCode } = req.params;
    
    const course = await Course.findOne({ courseCode })
      .populate('flagHistory.flaggedBy', 'name email')
      .select('courseCode subject flagHistory');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json({ 
      courseCode: course.courseCode,
      subject: course.subject,
      flagHistory: course.flagHistory
    });
  } catch (error) {
    console.error('Get course flag history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Bulk update course availability
const bulkUpdateCourseAvailability = async (req, res) => {
  try {
    const { courseCodes, isAvailableForNextSemester, reason } = req.body;
    const userId = req.user.id;
    
    if (!Array.isArray(courseCodes) || courseCodes.length === 0) {
      return res.status(400).json({ message: 'Course codes array is required' });
    }
    
    const results = [];
    
    for (const courseCode of courseCodes) {
      try {
        const course = await Course.findOne({ courseCode });
        if (course) {
          const previousStatus = course.isAvailableForNextSemester;
          course.isAvailableForNextSemester = isAvailableForNextSemester;
          
          course.flagHistory.push({
            action: isAvailableForNextSemester ? 'unflagged' : 'flagged',
            flaggedBy: userId,
            reason: reason || (isAvailableForNextSemester ? 'Bulk unflagged' : 'Bulk flagged')
          });
          
          await course.save();
          
          results.push({
            courseCode,
            success: true,
            previousStatus,
            newStatus: isAvailableForNextSemester
          });
        } else {
          results.push({
            courseCode,
            success: false,
            error: 'Course not found'
          });
        }
      } catch (error) {
        results.push({
          courseCode,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({ 
      message: 'Bulk update completed',
      results
    });
  } catch (error) {
    console.error('Bulk update course availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSubjectByCourseCode,
  getCourses,
  createCourse,
  updateCourseAvailability,
  getCourseFlagHistory,
  bulkUpdateCourseAvailability
};
