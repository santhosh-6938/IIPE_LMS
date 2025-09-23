const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rbac-education';

async function testPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a student user
    const student = await User.findOne({ role: 'student' });
    
    if (!student) {
      console.log('No student found');
      process.exit(0);
    }

    console.log('Found student:', {
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      hasPassword: !!student.password,
      passwordLength: student.password ? student.password.length : 0,
      isFirstLogin: student.isFirstLogin
    });

    // Test password comparison
    const testPassword = 'password123'; // Common test password
    
    console.log('\nTesting password comparison:');
    console.log('Test password:', testPassword);
    
    // Test with bcrypt.compare directly
    const directCompare = await bcrypt.compare(testPassword, student.password);
    console.log('Direct bcrypt.compare result:', directCompare);
    
    // Test with User model method
    const modelCompare = await student.comparePassword(testPassword);
    console.log('User model comparePassword result:', modelCompare);
    
    // Check if password looks like it's double-hashed
    const isDoubleHashed = student.password.length > 60; // bcrypt hashes are typically 60 chars
    console.log('Password appears double-hashed:', isDoubleHashed);
    
    // If it's double-hashed, let's try to fix it
    if (isDoubleHashed) {
      console.log('\nAttempting to fix double-hashed password...');
      
      // Try to extract the original hash by removing one layer
      // This is a bit tricky, but we can try to re-hash the password with a known salt
      const salt = student.password.substring(0, 29); // bcrypt salt is 29 chars
      const hash = student.password.substring(29);
      
      console.log('Extracted salt:', salt);
      console.log('Extracted hash:', hash);
      
      // Try to compare with the extracted hash
      const testHash = await bcrypt.hash(testPassword, salt);
      console.log('Test hash matches:', testHash === student.password);
    }

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run test
testPassword();
