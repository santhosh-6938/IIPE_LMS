const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Migration function to add blocking fields to existing users
const migrateUserBlocking = async () => {
  try {
    console.log('Starting user blocking fields migration...');

    // Find all users that don't have the new blocking fields
    const usersToUpdate = await User.find({
      $or: [
        { isBlocked: { $exists: false } },
        { blockedAt: { $exists: false } },
        { blockedBy: { $exists: false } },
        { blockedReason: { $exists: false } }
      ]
    });

    console.log(`Found ${usersToUpdate.length} users to update`);

    if (usersToUpdate.length === 0) {
      console.log('✅ All users already have blocking fields. Migration not needed.');
      return;
    }

    // Update users with default blocking field values
    const updatePromises = usersToUpdate.map(user => {
      const updateData = {};
      
      if (user.isBlocked === undefined) {
        updateData.isBlocked = false;
      }
      if (user.blockedAt === undefined) {
        updateData.blockedAt = null;
      }
      if (user.blockedBy === undefined) {
        updateData.blockedBy = null;
      }
      if (user.blockedReason === undefined) {
        updateData.blockedReason = null;
      }

      return User.findByIdAndUpdate(
        user._id,
        { $set: updateData },
        { new: true }
      );
    });

    const updatedUsers = await Promise.all(updatePromises);

    console.log(`✅ Successfully updated ${updatedUsers.length} users with blocking fields`);

    // Verify the migration
    const totalUsers = await User.countDocuments();
    const usersWithBlockingFields = await User.countDocuments({
      isBlocked: { $exists: true },
      blockedAt: { $exists: true },
      blockedBy: { $exists: true },
      blockedReason: { $exists: true }
    });

    console.log(`📊 Migration Summary:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with blocking fields: ${usersWithBlockingFields}`);
    console.log(`   Migration status: ${totalUsers === usersWithBlockingFields ? '✅ Complete' : '⚠️ Incomplete'}`);

    // Show sample of updated users
    const sampleUsers = await User.find({})
      .select('name email role isBlocked blockedAt blockedBy blockedReason')
      .limit(5);

    console.log('\n📋 Sample users after migration:');
    sampleUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}): isBlocked=${user.isBlocked}, blockedAt=${user.blockedAt || 'null'}`);
    });

    console.log('\n🎉 User blocking fields migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during user blocking migration:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUserBlocking()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateUserBlocking };
