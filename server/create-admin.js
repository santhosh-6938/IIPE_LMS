const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@iipe.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email: admin@iipe.com');
      console.log('Role: admin');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@iipe.com',
      password: 'admin123',
      role: 'admin',
      isFirstLogin: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@iipe.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('⚠️  Please change the password on first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdminUser();
