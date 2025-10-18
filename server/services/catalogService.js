// Enhanced catalog service with database integration and flagging support
const Course = require('../models/Course');

// Static mapping for programs, branches, and sections
const catalog = {
  programs: {
    'B.Tech': {
      branches: {
        'Chemical Engineering': { sections: ['A', 'B', 'C'] },
        'Mathematics and Computing': { sections: ['A', 'B', 'C'] },
        'Mechanical Engineering': { sections: ['A', 'B', 'C'] },
        'Petroleum Engineering': { sections: ['A', 'B', 'C'] },
      },
    },
    'M.Tech': {
      branches: {
        'Petroleum Engineering (For Foreign and Indian Nationals)': { sections: ['A', 'B'] },
        'Data Science and Machine Learning (Web-based)': { sections: ['A', 'B'] },
      },
    },
    'M.Sc': {
      branches: {
        'Applied Geology': { sections: ['A', 'B'] },
      },
    },
  },
};

function listBranches(programName) {
  const program = catalog.programs[programName];
  if (!program) return null;
  return Object.keys(program.branches);
}

function listSections(programName, branchKey) {
  const program = catalog.programs[programName];
  if (!program) return null;
  // Match exact branch name (case-sensitive)
  const branch = program.branches[branchKey];
  if (!branch) return null;
  return branch.sections || [];
}

// Database-backed function to get subject by course code with availability check
async function getSubjectByCourseCode(courseCode) {
  try {
    const key = String(courseCode || '').trim();
    const course = await Course.findOne({ 
      courseCode: key,
      isActive: true 
    });
    
    if (!course) return null;
    
    return {
      subject: course.subject,
      program: course.program,
      branch: course.branch,
      semester: course.semester,
      credits: course.credits,
      isAvailableForNextSemester: course.isAvailableForNextSemester
    };
  } catch (error) {
    console.error('Error fetching course by code:', error);
    return null;
  }
}

// Get available courses for a specific program, branch, and semester
async function getAvailableCourses(program, branch, semester) {
  try {
    const filter = {
      isActive: true,
      isAvailableForNextSemester: true
    };
    
    if (program) filter.program = program;
    if (branch) filter.branch = branch;
    if (semester && semester !== 'Both') {
      filter.semester = { $in: [semester, 'Both'] };
    }
    
    const courses = await Course.find(filter)
      .sort({ courseCode: 1 })
      .select('courseCode subject program branch semester credits');
    
    return courses;
  } catch (error) {
    console.error('Error fetching available courses:', error);
    return [];
  }
}

// Check if a course is available for the next semester
async function isCourseAvailableForNextSemester(courseCode) {
  try {
    const course = await Course.findOne({ 
      courseCode: courseCode.trim(),
      isActive: true 
    });
    
    return course ? course.isAvailableForNextSemester : false;
  } catch (error) {
    console.error('Error checking course availability:', error);
    return false;
  }
}

// Legacy function for backward compatibility
function getSubjectByCourseCodeSync(courseCode) {
  // This is a fallback for cases where async is not possible
  // In production, this should be replaced with proper async handling
  const key = String(courseCode || '').trim();
  
  // Static fallback mapping - matches database entries
  const fallbackCourses = {
    '1011': 'Introduction to Programming',
    '2022': 'Data Structures',
    '3033': 'Thermodynamics',
    '4044': 'Circuit Analysis',
  };
  
  return fallbackCourses[key] || null;
}

module.exports = {
  listBranches,
  listSections,
  getSubjectByCourseCode,
  getSubjectByCourseCodeSync,
  getAvailableCourses,
  isCourseAvailableForNextSemester,
};


