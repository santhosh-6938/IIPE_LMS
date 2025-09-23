const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rbac-education';

async function migrateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all existing users to set isFirstLogin to false (they've already logged in)
    const result = await User.updateMany(
      {}, // Update all users
      { 
        $set: { 
          isFirstLogin: false,
          createdBy: null,
          updatedBy: null
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} users`);

    // Update passwordChangeHistory for existing users
    const users = await User.find({});
    for (const user of users) {
      if (user.passwordChangeHistory && user.passwordChangeHistory.length > 0) {
        // Update existing password change history entries to include changedBy
        user.passwordChangeHistory = user.passwordChangeHistory.map(entry => ({
          ...entry,
          changedBy: entry.changedBy || user._id
        }));
        await user.save();
      }
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUsers();
