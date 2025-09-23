const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rbac-education';

async function fixDoubleHashedPasswords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users with potentially double-hashed passwords
    // Double-hashed passwords are typically longer than 60 characters
    const usersWithDoubleHashedPasswords = await User.find({
      password: { $regex: /^.{60,}$/ }
    });

    console.log(`Found ${usersWithDoubleHashedPasswords.length} users with potentially double-hashed passwords`);

    if (usersWithDoubleHashedPasswords.length === 0) {
      console.log('No users need password fixing');
      process.exit(0);
    }

    // Generate a temporary password for all affected users
    const tempPassword = 'TempPass123!';
    const salt = await bcrypt.genSalt(10);
    const hashedTempPassword = await bcrypt.hash(tempPassword, salt);

    console.log(`\nTemporary password for all affected users: ${tempPassword}`);
    console.log('Users will need to change this password on first login\n');

    // Update all affected users
    for (const user of usersWithDoubleHashedPasswords) {
      console.log(`Fixing password for: ${user.name} (${user.email})`);
      
      // Reset password to temporary password
      user.password = hashedTempPassword;
      user.isFirstLogin = true; // Force password change
      user.passwordHistory = []; // Clear password history
      user.passwordChangeCount = 0;
      
      await user.save();
      console.log(`  ✓ Password fixed for ${user.name}`);
    }

    console.log('\nPassword fixing completed successfully!');
    console.log(`\nIMPORTANT: All affected users now have the temporary password: ${tempPassword}`);
    console.log('They will be prompted to change it on their next login.');
    
    process.exit(0);
  } catch (error) {
    console.error('Password fixing failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixDoubleHashedPasswords();
