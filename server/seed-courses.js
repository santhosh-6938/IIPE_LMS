const mongoose = require('mongoose');
const Course = require('./models/Course');

// Sample course data
const sampleCourses = [
  // B.Tech CSE Courses
  { courseCode: '1011', subject: 'Introduction to Programming', program: 'B.Tech', branch: 'cse', semester: 'Autumn', credits: 3 },
  { courseCode: '1012', subject: 'Data Structures and Algorithms', program: 'B.Tech', branch: 'cse', semester: 'Spring', credits: 4 },
  { courseCode: '2022', subject: 'Data Structures', program: 'B.Tech', branch: 'cse', semester: 'Spring', credits: 4 },
  { courseCode: '1013', subject: 'Database Management Systems', program: 'B.Tech', branch: 'cse', semester: 'Both', credits: 3 },
  { courseCode: '1014', subject: 'Computer Networks', program: 'B.Tech', branch: 'cse', semester: 'Autumn', credits: 3 },
  { courseCode: '1015', subject: 'Operating Systems', program: 'B.Tech', branch: 'cse', semester: 'Spring', credits: 4 },
  
  // B.Tech ECE Courses
  { courseCode: '2011', subject: 'Digital Electronics', program: 'B.Tech', branch: 'ece', semester: 'Autumn', credits: 3 },
  { courseCode: '2012', subject: 'Analog Electronics', program: 'B.Tech', branch: 'ece', semester: 'Spring', credits: 4 },
  { courseCode: '2013', subject: 'Communication Systems', program: 'B.Tech', branch: 'ece', semester: 'Both', credits: 3 },
  { courseCode: '2014', subject: 'Microprocessors', program: 'B.Tech', branch: 'ece', semester: 'Autumn', credits: 3 },
  
  // B.Tech Mechanical Courses
  { courseCode: '3011', subject: 'Thermodynamics', program: 'B.Tech', branch: 'mech', semester: 'Autumn', credits: 3 },
  { courseCode: '3033', subject: 'Thermodynamics', program: 'B.Tech', branch: 'mech', semester: 'Autumn', credits: 3 },
  { courseCode: '3012', subject: 'Fluid Mechanics', program: 'B.Tech', branch: 'mech', semester: 'Spring', credits: 4 },
  { courseCode: '3013', subject: 'Machine Design', program: 'B.Tech', branch: 'mech', semester: 'Both', credits: 3 },
  { courseCode: '3014', subject: 'Heat Transfer', program: 'B.Tech', branch: 'mech', semester: 'Autumn', credits: 3 },
  
  // B.Tech Chemical Courses
  { courseCode: '4011', subject: 'Introduction to Chemistry', program: 'B.Tech', branch: 'chem', semester: 'Autumn', credits: 3 },
  { courseCode: '4012', subject: 'Organic Chemistry', program: 'B.Tech', branch: 'chem', semester: 'Spring', credits: 4 },
  { courseCode: '4013', subject: 'Physical Chemistry', program: 'B.Tech', branch: 'chem', semester: 'Both', credits: 3 },
  
  // B.Tech Civil Courses
  { courseCode: '5011', subject: 'Structural Analysis', program: 'B.Tech', branch: 'civil', semester: 'Autumn', credits: 3 },
  { courseCode: '5012', subject: 'Concrete Technology', program: 'B.Tech', branch: 'civil', semester: 'Spring', credits: 4 },
  { courseCode: '5013', subject: 'Surveying', program: 'B.Tech', branch: 'civil', semester: 'Both', credits: 3 },
  
  // B.Tech EEE Courses
  { courseCode: '6011', subject: 'Circuit Analysis', program: 'B.Tech', branch: 'eee', semester: 'Autumn', credits: 3 },
  { courseCode: '4044', subject: 'Circuit Analysis', program: 'B.Tech', branch: 'eee', semester: 'Spring', credits: 4 },
  { courseCode: '6012', subject: 'Power Systems', program: 'B.Tech', branch: 'eee', semester: 'Spring', credits: 4 },
  { courseCode: '6013', subject: 'Electrical Machines', program: 'B.Tech', branch: 'eee', semester: 'Both', credits: 3 },
  
  // B.Tech IT Courses
  { courseCode: '7011', subject: 'Web Technologies', program: 'B.Tech', branch: 'it', semester: 'Autumn', credits: 3 },
  { courseCode: '7012', subject: 'Software Engineering', program: 'B.Tech', branch: 'it', semester: 'Spring', credits: 4 },
  { courseCode: '7013', subject: 'Information Security', program: 'B.Tech', branch: 'it', semester: 'Both', credits: 3 },
  
  // M.Tech CSE Courses
  { courseCode: '8011', subject: 'Advanced Algorithms', program: 'M.Tech', branch: 'cse', semester: 'Autumn', credits: 3 },
  { courseCode: '8012', subject: 'Machine Learning', program: 'M.Tech', branch: 'cse', semester: 'Spring', credits: 4 },
  { courseCode: '8013', subject: 'Distributed Systems', program: 'M.Tech', branch: 'cse', semester: 'Both', credits: 3 },
  
  // M.Tech AI Courses
  { courseCode: '8021', subject: 'Deep Learning', program: 'M.Tech', branch: 'ai', semester: 'Autumn', credits: 4 },
  { courseCode: '8022', subject: 'Natural Language Processing', program: 'M.Tech', branch: 'ai', semester: 'Spring', credits: 3 },
  { courseCode: '8023', subject: 'Computer Vision', program: 'M.Tech', branch: 'ai', semester: 'Both', credits: 3 },
  
  // M.Tech Data Science Courses
  { courseCode: '8031', subject: 'Data Mining', program: 'M.Tech', branch: 'data science', semester: 'Autumn', credits: 3 },
  { courseCode: '8032', subject: 'Big Data Analytics', program: 'M.Tech', branch: 'data science', semester: 'Spring', credits: 4 },
  { courseCode: '8033', subject: 'Statistical Learning', program: 'M.Tech', branch: 'data science', semester: 'Both', credits: 3 },
  
  // M.Tech VLSI Courses
  { courseCode: '8041', subject: 'VLSI Design', program: 'M.Tech', branch: 'vlsi', semester: 'Autumn', credits: 3 },
  { courseCode: '8042', subject: 'Digital System Design', program: 'M.Tech', branch: 'vlsi', semester: 'Spring', credits: 4 },
  { courseCode: '8043', subject: 'CMOS Technology', program: 'M.Tech', branch: 'vlsi', semester: 'Both', credits: 3 },
  
  // M.Tech Mechanical Courses
  { courseCode: '8051', subject: 'Advanced Thermodynamics', program: 'M.Tech', branch: 'mech', semester: 'Autumn', credits: 3 },
  { courseCode: '8052', subject: 'Computational Fluid Dynamics', program: 'M.Tech', branch: 'mech', semester: 'Spring', credits: 4 },
  { courseCode: '8053', subject: 'Finite Element Analysis', program: 'M.Tech', branch: 'mech', semester: 'Both', credits: 3 },
  
  // M.Sc Chemistry Courses
  { courseCode: '9011', subject: 'Advanced Organic Chemistry', program: 'M.Sc', branch: 'chemistry', semester: 'Autumn', credits: 3 },
  { courseCode: '9012', subject: 'Inorganic Chemistry', program: 'M.Sc', branch: 'chemistry', semester: 'Spring', credits: 4 },
  { courseCode: '9013', subject: 'Analytical Chemistry', program: 'M.Sc', branch: 'chemistry', semester: 'Both', credits: 3 },
  
  // M.Sc Physics Courses
  { courseCode: '9021', subject: 'Quantum Mechanics', program: 'M.Sc', branch: 'physics', semester: 'Autumn', credits: 3 },
  { courseCode: '9022', subject: 'Electromagnetic Theory', program: 'M.Sc', branch: 'physics', semester: 'Spring', credits: 4 },
  { courseCode: '9023', subject: 'Statistical Mechanics', program: 'M.Sc', branch: 'physics', semester: 'Both', credits: 3 },
  
  // M.Sc Mathematics Courses
  { courseCode: '9031', subject: 'Real Analysis', program: 'M.Sc', branch: 'mathematics', semester: 'Autumn', credits: 3 },
  { courseCode: '9032', subject: 'Complex Analysis', program: 'M.Sc', branch: 'mathematics', semester: 'Spring', credits: 4 },
  { courseCode: '9033', subject: 'Algebra', program: 'M.Sc', branch: 'mathematics', semester: 'Both', credits: 3 },
];

async function seedCourses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iip_lms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Clear existing courses
    await Course.deleteMany({});
    console.log('Cleared existing courses');
    
    // Insert sample courses
    const courses = await Course.insertMany(sampleCourses);
    console.log(`Inserted ${courses.length} courses`);
    
    // Flag some courses as unavailable for next semester (for testing)
    const coursesToFlag = ['1014', '2012', '3011', '4012', '5011'];
    for (const courseCode of coursesToFlag) {
      await Course.findOneAndUpdate(
        { courseCode },
        { 
          isAvailableForNextSemester: false,
          flagHistory: [{
            action: 'flagged',
            flaggedBy: new mongoose.Types.ObjectId(), // Dummy admin ID
            reason: 'Course under revision for next semester'
          }]
        }
      );
    }
    console.log(`Flagged ${coursesToFlag.length} courses as unavailable`);
    
    console.log('Course seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding courses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  seedCourses();
}

module.exports = seedCourses;
