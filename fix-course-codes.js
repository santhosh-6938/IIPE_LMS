const mongoose = require('mongoose');
const Course = require('./server/models/Course');

async function checkAndFixCourses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iip_lms');
    console.log('Connected to MongoDB');
    
    // Check current courses
    const courses = await Course.find({}).select('courseCode subject program branch');
    console.log('\nCurrent courses in database:');
    courses.forEach(course => {
      console.log(`- ${course.courseCode}: ${course.subject} (${course.program} - ${course.branch})`);
    });
    
    // Check for the specific course codes that are causing issues
    const targetCodes = ['1011', '2022', '3033', '4044'];
    console.log('\nChecking for specific course codes:');
    for (const code of targetCodes) {
      const course = await Course.findOne({ courseCode: code });
      console.log(`${code}: ${course ? 'Found - ' + course.subject : 'NOT FOUND'}`);
    }
    
    // Add the missing course codes
    const missingCourses = [
      {
        courseCode: '1011',
        subject: 'Introduction to Chemistry',
        program: 'B.Tech',
        branch: 'chem',
        semester: 'Autumn',
        credits: 3,
        description: 'Basic chemistry concepts and principles'
      },
      {
        courseCode: '2022',
        subject: 'Data Structures',
        program: 'B.Tech',
        branch: 'cse',
        semester: 'Spring',
        credits: 4,
        description: 'Introduction to data structures and algorithms'
      },
      {
        courseCode: '3033',
        subject: 'Thermodynamics',
        program: 'B.Tech',
        branch: 'mech',
        semester: 'Autumn',
        credits: 3,
        description: 'Fundamentals of thermodynamics'
      },
      {
        courseCode: '4044',
        subject: 'Circuit Analysis',
        program: 'B.Tech',
        branch: 'eee',
        semester: 'Spring',
        credits: 4,
        description: 'Basic electrical circuit analysis'
      }
    ];
    
    console.log('\nAdding missing course codes...');
    for (const courseData of missingCourses) {
      const existingCourse = await Course.findOne({ courseCode: courseData.courseCode });
      if (!existingCourse) {
        const course = new Course(courseData);
        await course.save();
        console.log(`✅ Added: ${courseData.courseCode} - ${courseData.subject}`);
      } else {
        console.log(`⚠️  Already exists: ${courseData.courseCode} - ${existingCourse.subject}`);
      }
    }
    
    // Verify the courses are now available
    console.log('\nVerifying course codes after addition:');
    for (const code of targetCodes) {
      const course = await Course.findOne({ courseCode: code });
      console.log(`${code}: ${course ? '✅ Found - ' + course.subject : '❌ Still not found'}`);
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Course code fix completed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

checkAndFixCourses();
