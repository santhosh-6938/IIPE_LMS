const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rbac-education';

async function migrateRollNumbers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all students without roll numbers
    const studentsWithoutRollNumbers = await User.find({
      role: 'student',
      rollNumber: { $exists: false }
    });

    console.log(`Found ${studentsWithoutRollNumbers.length} students without roll numbers`);

    if (studentsWithoutRollNumbers.length === 0) {
      console.log('No students need roll number migration');
      process.exit(0);
    }

    // Add roll numbers to students
    for (let i = 0; i < studentsWithoutRollNumbers.length; i++) {
      const student = studentsWithoutRollNumbers[i];
      
      // Generate a roll number based on email or create a unique one
      let rollNumber;
      if (student.email) {
        // Extract username from email and add a number
        const username = student.email.split('@')[0];
        rollNumber = `${username.toUpperCase()}${String(i + 1).padStart(3, '0')}`;
      } else {
        // Fallback roll number
        rollNumber = `STU${String(i + 1).padStart(6, '0')}`;
      }

      // Check if this roll number already exists
      const existingUser = await User.findOne({ rollNumber });
      if (existingUser) {
        // If exists, add more uniqueness
        rollNumber = `${rollNumber}${Date.now().toString().slice(-4)}`;
      }

      // Update the student with the roll number
      student.rollNumber = rollNumber;
      await student.save();
      
      console.log(`Updated ${student.name} (${student.email}) with roll number: ${rollNumber}`);
    }

    console.log('Roll number migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateRollNumbers();
