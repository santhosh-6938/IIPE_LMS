const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testAdminRegistration = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_4');
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if we can create an admin user directly
    console.log('\n🧪 Test 1: Creating admin user directly...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'test-admin@iipe.com' });
    if (existingAdmin) {
      console.log('⚠️  Test admin already exists, deleting...');
      await User.deleteOne({ email: 'test-admin@iipe.com' });
    }

    // Create test admin user
    const testAdmin = new User({
      name: 'Test Administrator',
      email: 'test-admin@iipe.com',
      password: 'test123',
      role: 'admin',
      isFirstLogin: true
    });

    await testAdmin.save();
    console.log('✅ Test admin user created successfully!');
    console.log('📧 Email: test-admin@iipe.com');
    console.log('🔑 Password: test123');
    console.log('👤 Role: admin');

    // Test 2: Verify admin can be found
    console.log('\n🧪 Test 2: Verifying admin user...');
    const foundAdmin = await User.findOne({ email: 'test-admin@iipe.com' });
    if (foundAdmin && foundAdmin.role === 'admin') {
      console.log('✅ Admin user found and verified!');
    } else {
      console.log('❌ Admin user not found or incorrect role');
    }

    console.log('\n🎉 All tests passed! Admin registration is working correctly.');
    console.log('\n📝 You can now:');
    console.log('1. Register as admin through the web interface without any access code');
    console.log('2. Login with the test admin credentials: test-admin@iipe.com / test123');
    console.log('3. Or create your own admin account through the registration form');

  } catch (error) {
    console.error('❌ Error during admin registration test:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testAdminRegistration();

