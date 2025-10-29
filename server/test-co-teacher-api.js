const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

async function testCoTeacherAPI() {
  try {
    console.log('Testing Co-Teacher API endpoints...\n');

    // Test 1: Check if co-teacher routes are accessible
    console.log('1. Testing co-teacher route accessibility...');
    try {
      const response = await axios.get(`${API_URL}/co-teacher/classrooms`);
      console.log('✓ Co-teacher routes are accessible');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ Co-teacher routes are accessible (authentication required)');
      } else {
        console.log('✗ Co-teacher routes not accessible:', error.message);
      }
    }

    // Test 2: Check if the route exists (should return 401 without auth)
    console.log('\n2. Testing route existence...');
    try {
      const response = await axios.get(`${API_URL}/co-teacher/invitations/test123`);
      console.log('✗ Unexpected success - should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ Route exists and requires authentication');
      } else if (error.response?.status === 404) {
        console.log('✗ Route not found');
      } else {
        console.log('✓ Route exists (status:', error.response?.status, ')');
      }
    }

    // Test 3: Check if invitation route exists
    console.log('\n3. Testing invitation route...');
    try {
      const response = await axios.get(`${API_URL}/co-teacher/invitation/test-token`);
      console.log('✗ Unexpected success - should return error for invalid token');
    } catch (error) {
      console.log('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      if (error.response?.status === 404 && error.response?.data?.code === 'INVALID_OR_EXPIRED') {
        console.log('✓ Invitation route exists and working correctly');
      } else if (error.response?.status === 404) {
        console.log('✗ Invitation route not found');
      } else {
        console.log('✓ Invitation route exists (status:', error.response?.status, ')');
      }
    }

    console.log('\n=== Co-Teacher API Test Completed ===');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run test if called directly
if (require.main === module) {
  testCoTeacherAPI()
    .then(() => {
      console.log('Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = testCoTeacherAPI;
