const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const setupEnvironment = () => {
  const envContent = `# Database
MONGODB_URI=mongodb://localhost:27017/lms_4

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin Access Code for self-registration
ADMIN_ACCESS_CODE=ADMIN2024

# Email Configuration (optional)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password
# EMAIL_FROM=noreply@yourdomain.com

# Server Port
PORT=8000
`;

  const envPath = path.join(__dirname, '.env');

  try {
    if (fs.existsSync(envPath)) {
      console.log('⚠️  .env file already exists');
      return true;
    } else {
      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env file created successfully!');
      return true;
    }
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    return false;
  }
};

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@iipe.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email: admin@iipe.com');
      console.log('👤 Role: admin');
      return true;
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
    return true;

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    return false;
  } finally {
    await mongoose.disconnect();
  }
};

const main = async () => {
  console.log('🚀 Setting up LMS Admin System...\n');

  // Step 1: Setup environment
  console.log('1️⃣ Setting up environment variables...');
  const envSetup = setupEnvironment();
  if (!envSetup) {
    console.log('❌ Failed to setup environment. Exiting...');
    process.exit(1);
  }

  // Step 2: Create admin user
  console.log('\n2️⃣ Creating admin user...');
  const adminCreated = await createAdminUser();
  if (!adminCreated) {
    console.log('❌ Failed to create admin user. Exiting...');
    process.exit(1);
  }

  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Start your server: npm start');
  console.log('2. Login with admin credentials: admin@iipe.com / admin123');
  console.log('3. Change the admin password on first login');
  console.log('4. For admin self-registration, use access code: ADMIN2024');
  console.log('\n🔧 You can modify the ADMIN_ACCESS_CODE in server/.env if needed');
};

main().catch(console.error);
