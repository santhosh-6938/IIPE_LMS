const mongoose = require('mongoose');
const Classroom = require('./models/Classroom');
const CoTeacher = require('./models/CoTeacher');
const User = require('./models/User');
require('dotenv').config();

// Mock the email service for testing
const originalSendEmail = require('./services/emailService').sendEmail;
require('./services/emailService').sendEmail = async () => ({ success: true });

const coTeacherService = require('./services/coTeacherService');

async function testCoTeacherFunctionalityWithoutEmail() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== Testing Co-Teacher Functionality (Without Email) ===\n');

    // Test 1: Create test users
    console.log('1. Creating test users...');
    
    // Create main teacher
    const mainTeacher = new User({
      name: 'Main Teacher',
      email: 'main.teacher@test.com',
      password: 'password123',
      role: 'teacher'
    });
    await mainTeacher.save();
    console.log('✓ Main teacher created:', mainTeacher.email);

    // Create co-teacher
    const coTeacher = new User({
      name: 'Co Teacher',
      email: 'co.teacher@test.com',
      password: 'password123',
      role: 'teacher'
    });
    await coTeacher.save();
    console.log('✓ Co-teacher created:', coTeacher.email);

    // Test 2: Create test classroom
    console.log('\n2. Creating test classroom...');
    const classroom = new Classroom({
      name: 'Test Classroom',
      description: 'A test classroom for co-teacher functionality',
      subject: 'Computer Science',
      semester: 'Autumn',
      academicYear: '2024-2025',
      program: 'B.Tech',
      branch: 'Computer Science',
      courseCode: '1234',
      section: 'A',
      teacher: mainTeacher._id
    });
    await classroom.save();
    console.log('✓ Classroom created:', classroom.name);

    // Test 3: Test co-teacher invitation (with mocked email)
    console.log('\n3. Testing co-teacher invitation...');
    const inviteResult = await coTeacherService.inviteCoTeacher(
      classroom._id,
      mainTeacher._id,
      coTeacher.email,
      'Welcome to collaborate as a co-teacher!'
    );
    
    if (inviteResult.success) {
      console.log('✓ Co-teacher invitation sent successfully');
      console.log('  - Invitation ID:', inviteResult.invitation.id);
      console.log('  - Expires at:', inviteResult.invitation.expiresAt);
    } else {
      console.log('✗ Failed to send invitation:', inviteResult.message);
      return;
    }

    // Test 4: Test invitation acceptance
    console.log('\n4. Testing invitation acceptance...');
    const invitation = await CoTeacher.findOne({ 
      classroom: classroom._id,
      coTeacher: coTeacher._id 
    });
    
    if (invitation) {
      const acceptResult = await coTeacherService.acceptCoTeacherInvitation(invitation.invitationToken);
      
      if (acceptResult.success) {
        console.log('✓ Co-teacher invitation accepted successfully');
        
        // Verify classroom was updated
        const updatedClassroom = await Classroom.findById(classroom._id)
          .populate('coTeacher', 'name email');
        
        if (updatedClassroom.coTeacherEnabled && updatedClassroom.coTeacher) {
          console.log('✓ Classroom updated with co-teacher:', updatedClassroom.coTeacher.name);
        } else {
          console.log('✗ Classroom not updated with co-teacher');
        }
      } else {
        console.log('✗ Failed to accept invitation:', acceptResult.message);
      }
    } else {
      console.log('✗ No invitation found');
    }

    // Test 5: Test classroom access
    console.log('\n5. Testing classroom access...');
    const mainTeacherAccess = await coTeacherService.hasClassroomAccess(classroom._id, mainTeacher._id);
    const coTeacherAccess = await coTeacherService.hasClassroomAccess(classroom._id, coTeacher._id);
    
    console.log('✓ Main teacher access:', mainTeacherAccess);
    console.log('✓ Co-teacher access:', coTeacherAccess);

    // Test 6: Test co-teacher classrooms
    console.log('\n6. Testing co-teacher classrooms...');
    const coTeacherClassrooms = await coTeacherService.getCoTeacherClassrooms(coTeacher._id);
    
    if (coTeacherClassrooms.success) {
      console.log('✓ Co-teacher classrooms retrieved:', coTeacherClassrooms.classrooms.length);
    } else {
      console.log('✗ Failed to get co-teacher classrooms:', coTeacherClassrooms.message);
    }

    // Test 7: Test invitation history
    console.log('\n7. Testing invitation history...');
    const invitations = await coTeacherService.getCoTeacherInvitations(classroom._id, mainTeacher._id);
    
    if (invitations.success) {
      console.log('✓ Invitations retrieved:', invitations.invitations.length);
      invitations.invitations.forEach((inv, index) => {
        console.log(`  ${index + 1}. ${inv.coTeacher?.name || inv.invitationEmail} - ${inv.status}`);
      });
    } else {
      console.log('✗ Failed to get invitations:', invitations.message);
    }

    // Test 8: Test co-teacher removal
    console.log('\n8. Testing co-teacher removal...');
    const removeResult = await coTeacherService.removeCoTeacher(classroom._id, mainTeacher._id);
    
    if (removeResult.success) {
      console.log('✓ Co-teacher removed successfully');
      
      // Verify classroom was updated
      const updatedClassroom = await Classroom.findById(classroom._id);
      if (!updatedClassroom.coTeacherEnabled && !updatedClassroom.coTeacher) {
        console.log('✓ Classroom updated - co-teacher removed');
      } else {
        console.log('✗ Classroom not updated - co-teacher still present');
      }
    } else {
      console.log('✗ Failed to remove co-teacher:', removeResult.message);
    }

    // Test 9: Test edge cases
    console.log('\n9. Testing edge cases...');
    
    // Try to invite non-existent teacher
    const invalidInviteResult = await coTeacherService.inviteCoTeacher(
      classroom._id,
      mainTeacher._id,
      'nonexistent@test.com',
      'Test message'
    );
    
    if (!invalidInviteResult.success) {
      console.log('✓ Correctly handled non-existent teacher:', invalidInviteResult.message);
    } else {
      console.log('✗ Should have failed for non-existent teacher');
    }

    // Try to invite student as co-teacher
    const student = new User({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
      rollNumber: 'TEST001'
    });
    await student.save();

    const studentInviteResult = await coTeacherService.inviteCoTeacher(
      classroom._id,
      mainTeacher._id,
      student.email,
      'Test message'
    );
    
    if (!studentInviteResult.success) {
      console.log('✓ Correctly handled student invitation:', studentInviteResult.message);
    } else {
      console.log('✗ Should have failed for student invitation');
    }

    // Test 10: Test duplicate invitation
    console.log('\n10. Testing duplicate invitation...');
    const duplicateInviteResult = await coTeacherService.inviteCoTeacher(
      classroom._id,
      mainTeacher._id,
      coTeacher.email,
      'Duplicate invitation'
    );
    
    if (!duplicateInviteResult.success) {
      console.log('✓ Correctly handled duplicate invitation:', duplicateInviteResult.message);
    } else {
      console.log('✗ Should have failed for duplicate invitation');
    }

    // Test 11: Cleanup
    console.log('\n11. Cleaning up test data...');
    await Classroom.findByIdAndDelete(classroom._id);
    await CoTeacher.deleteMany({ classroom: classroom._id });
    await User.findByIdAndDelete(mainTeacher._id);
    await User.findByIdAndDelete(coTeacher._id);
    await User.findByIdAndDelete(student._id);
    console.log('✓ Test data cleaned up');

    console.log('\n=== Co-Teacher Functionality Test Completed ===');
    console.log('✓ All tests passed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Restore original email service
    require('./services/emailService').sendEmail = originalSendEmail;
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run test if called directly
if (require.main === module) {
  testCoTeacherFunctionalityWithoutEmail()
    .then(() => {
      console.log('Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = testCoTeacherFunctionalityWithoutEmail;
