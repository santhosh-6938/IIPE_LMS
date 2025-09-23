const fs = require('fs');
const path = require('path');

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
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists. Please check if ADMIN_ACCESS_CODE is set.');
    console.log('Current .env content:');
    console.log(fs.readFileSync(envPath, 'utf8'));
  } else {
    // Create .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('📝 Admin Access Code: ADMIN2024');
    console.log('🔧 You can change the ADMIN_ACCESS_CODE in the .env file if needed.');
  }
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n📋 Please create a .env file manually with the following content:');
  console.log(envContent);
}
