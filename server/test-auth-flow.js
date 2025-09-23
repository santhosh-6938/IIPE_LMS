const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rbac-education';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function testAuthFlow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find or create a test student
    let testStudent = await User.findOne({ email: 'test@student.com' });
    
    if (!testStudent) {
      console.log('Creating test student...');
      testStudent = new User({
        name: 'Test Student',
        email: 'test@student.com',
        rollNumber: 'TEST001',
        password: 'testpass123',
        role: 'student',
        isFirstLogin: false
      });
      await testStudent.save();
      console.log('Test student created');
    } else {
      console.log('Test student found:', testStudent.name);
    }

    console.log('\n=== Testing Authentication Flow ===\n');

    // Test 1: Login with correct credentials
    console.log('1. Testing login with correct credentials...');
    const isMatch = await bcrypt.compare('testpass123', testStudent.password);
    console.log('Password match:', isMatch);
    
    if (isMatch) {
      // Generate token
      const token = jwt.sign(
        { userId: testStudent._id, role: testStudent.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      console.log('Token generated successfully');
      console.log('Token length:', token.length);
      
      // Test 2: Verify token
      console.log('\n2. Testing token verification...');
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token decoded successfully:', {
          userId: decoded.userId,
          role: decoded.role,
          iat: decoded.iat,
          exp: decoded.exp
        });
        
        // Test 3: Find user with token
        console.log('\n3. Testing user retrieval with token...');
        const user = await User.findById(decoded.userId).select('-password');
        if (user) {
          console.log('User retrieved successfully:', {
            name: user.name,
            email: user.email,
            role: user.role,
            rollNumber: user.rollNumber
          });
        } else {
          console.log('Failed to retrieve user');
        }
        
      } catch (tokenError) {
        console.error('Token verification failed:', tokenError.message);
      }
    } else {
      console.log('Password comparison failed - cannot proceed with token tests');
    }

    // Test 4: Check if there are any users with double-hashed passwords
    console.log('\n4. Checking for double-hashed passwords...');
    const usersWithLongPasswords = await User.find({
      password: { $regex: /^.{60,}$/ }
    });
    
    if (usersWithLongPasswords.length > 0) {
      console.log(`Found ${usersWithLongPasswords.length} users with potentially double-hashed passwords:`);
      usersWithLongPasswords.forEach(user => {
        console.log(`  - ${user.name} (${user.email}): ${user.password.length} chars`);
      });
    } else {
      console.log('No users with double-hashed passwords found');
    }

    console.log('\n=== Authentication Flow Test Complete ===');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run test
testAuthFlow();
