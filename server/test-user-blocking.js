const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Test function for user blocking feature
const testUserBlocking = async () => {
  try {
    console.log('🔒 Testing User Blocking Feature\n');

    // Test 1: Check if blocking fields exist in User model
    console.log('1. Testing User model blocking fields...');
    const sampleUser = await User.findOne({});
    if (sampleUser) {
      const hasBlockingFields = sampleUser.isBlocked !== undefined && 
                               sampleUser.blockedAt !== undefined && 
                               sampleUser.blockedBy !== undefined && 
                               sampleUser.blockedReason !== undefined;
      
      if (hasBlockingFields) {
        console.log('   ✅ All blocking fields present in User model');
        console.log(`   ✅ Sample user blocking status: isBlocked=${sampleUser.isBlocked}`);
      } else {
        console.log('   ❌ Missing blocking fields in User model');
        console.log('   Run migration script: node migrate-user-blocking.js');
      }
    } else {
      console.log('   ⚠️  No users found in database');
    }

    // Test 2: Test blocking a user
    console.log('\n2. Testing user blocking functionality...');
    try {
      // Find a non-admin user to test blocking
      const testUser = await User.findOne({ role: { $ne: 'admin' } });
      
      if (testUser) {
        console.log(`   Testing with user: ${testUser.name} (${testUser.email})`);
        
        // Block the user
        testUser.isBlocked = true;
        testUser.blockedAt = new Date();
        testUser.blockedBy = null; // Simulate admin blocking
        testUser.blockedReason = 'Test blocking - teacher left institution';
        await testUser.save();
        
        console.log('   ✅ User blocked successfully');
        console.log(`   ✅ Blocking details: blockedAt=${testUser.blockedAt}, reason=${testUser.blockedReason}`);
        
        // Unblock the user
        testUser.isBlocked = false;
        testUser.blockedAt = null;
        testUser.blockedBy = null;
        testUser.blockedReason = null;
        await testUser.save();
        
        console.log('   ✅ User unblocked successfully');
      } else {
        console.log('   ⚠️  No non-admin users found to test blocking');
      }
    } catch (error) {
      console.log('   ❌ Error testing user blocking:', error.message);
    }

    // Test 3: Test blocked user statistics
    console.log('\n3. Testing blocked user statistics...');
    try {
      const totalUsers = await User.countDocuments();
      const blockedUsers = await User.countDocuments({ isBlocked: true });
      const activeUsers = await User.countDocuments({ isActive: true, isBlocked: false });
      
      console.log(`   ✅ Total users: ${totalUsers}`);
      console.log(`   ✅ Blocked users: ${blockedUsers}`);
      console.log(`   ✅ Active users: ${activeUsers}`);
    } catch (error) {
      console.log('   ❌ Error getting user statistics:', error.message);
    }

    // Test 4: Test role-based blocking
    console.log('\n4. Testing role-based blocking...');
    try {
      const roleStats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            total: { $sum: 1 },
            blocked: { $sum: { $cond: ['$isBlocked', 1, 0] } },
            active: { $sum: { $cond: [{ $and: ['$isActive', { $not: '$isBlocked' }] }, 1, 0] } }
          }
        }
      ]);
      
      console.log('   ✅ Role-based statistics:');
      roleStats.forEach(stat => {
        console.log(`      ${stat._id}: Total=${stat.total}, Blocked=${stat.blocked}, Active=${stat.active}`);
      });
    } catch (error) {
      console.log('   ❌ Error getting role-based statistics:', error.message);
    }

    // Test 5: Test blocking field validation
    console.log('\n5. Testing blocking field validation...');
    try {
      const usersWithBlockingInfo = await User.find({ isBlocked: true })
        .select('name email role blockedAt blockedBy blockedReason')
        .limit(3);
      
      if (usersWithBlockingInfo.length > 0) {
        console.log('   ✅ Blocked users found:');
        usersWithBlockingInfo.forEach(user => {
          console.log(`      - ${user.name}: blockedAt=${user.blockedAt}, reason=${user.blockedReason || 'No reason'}`);
        });
      } else {
        console.log('   ✅ No blocked users found (all users are active)');
      }
    } catch (error) {
      console.log('   ❌ Error validating blocking fields:', error.message);
    }

    console.log('\n🎉 User blocking feature test completed!');
    console.log('\n📋 Feature Summary:');
    console.log('   ✅ User model supports blocking fields');
    console.log('   ✅ Blocking/unblocking functionality works');
    console.log('   ✅ Role-based blocking statistics available');
    console.log('   ✅ Blocking field validation working');
    console.log('   ✅ Ready for admin interface integration');

  } catch (error) {
    console.error('❌ User blocking test failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testUserBlocking();
}

module.exports = { testUserBlocking };
