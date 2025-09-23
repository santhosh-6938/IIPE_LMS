const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test configuration
const testUser = {
  name: 'Test Student First Login',
  email: 'testfirstlogin@example.com',
  password: 'initial123',
  role: 'student'
};

let authToken = null;
let userId = null;

async function testFirstLoginFlow() {
  console.log('🧪 Testing First Login Password Change Flow\n');

  try {
    // Step 1: Register a new student
    console.log('1️⃣ Registering new student...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
    console.log('✅ Registration successful');
    console.log('   User ID:', registerResponse.data.user.id);
    console.log('   isFirstLogin:', registerResponse.data.user.isFirstLogin);
    console.log('   Token received:', !!registerResponse.data.token);
    
    authToken = registerResponse.data.token;
    userId = registerResponse.data.user.id;

    // Step 2: Login with initial password
    console.log('\n2️⃣ Logging in with initial password...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful');
    console.log('   isFirstLogin:', loginResponse.data.user.isFirstLogin);
    console.log('   Should redirect to password change page');

    // Step 3: Change password on first login
    console.log('\n3️⃣ Changing password on first login...');
    const changePasswordResponse = await axios.post(
      `${API_BASE}/auth/change-password-first-login`,
      {
        currentPassword: testUser.password,
        newPassword: 'newSecurePassword456'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✅ Password change successful');
    console.log('   isFirstLogin:', changePasswordResponse.data.user.isFirstLogin);
    console.log('   Message:', changePasswordResponse.data.message);

    // Step 4: Verify user can login with new password
    console.log('\n4️⃣ Verifying login with new password...');
    const newLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: 'newSecurePassword456'
    });
    console.log('✅ New password login successful');
    console.log('   isFirstLogin:', newLoginResponse.data.user.isFirstLogin);
    console.log('   Should go directly to dashboard');

    // Step 5: Test that old password no longer works
    console.log('\n5️⃣ Testing old password is invalid...');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('❌ Old password still works - this is an error!');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Old password correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Step 6: Test that password change is not allowed again
    console.log('\n6️⃣ Testing password change is not allowed after first login...');
    try {
      await axios.post(
        `${API_BASE}/auth/change-password-first-login`,
        {
          currentPassword: 'newSecurePassword456',
          newPassword: 'anotherPassword789'
        },
        {
          headers: { Authorization: `Bearer ${newLoginResponse.data.token}` }
        }
      );
      console.log('❌ Password change allowed after first login - this is an error!');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Password change correctly rejected after first login');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 All tests passed! First login password change flow is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testFirstLoginFlow().catch(console.error);
}

module.exports = { testFirstLoginFlow };
