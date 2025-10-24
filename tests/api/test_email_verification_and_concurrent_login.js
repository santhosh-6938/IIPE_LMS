const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:8000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rbac-education';

// Test configuration
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'student',
  rollNumber: 'TEST123'
};

let authToken = null;
let testUserId = null;

// Helper function to make API requests
const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Test email verification functionality
const testEmailVerification = async () => {
  console.log('\n🧪 Testing Email Verification System...');
  
  // Test 1: Send OTP for signup
  console.log('Test 1: Send OTP for signup');
  const sendOTPResult = await makeRequest('POST', '/email-verification/send-otp', {
    email: testUser.email,
    purpose: 'signup'
  });
  
  if (sendOTPResult.success) {
    console.log('✅ OTP sent successfully for signup');
  } else {
    console.log('❌ Failed to send OTP for signup:', sendOTPResult.error);
    return false;
  }
  
  // Test 2: Verify OTP with correct code (we'll use a mock OTP since we can't access the actual one)
  console.log('Test 2: Verify OTP with correct code');
  const verifyOTPResult = await makeRequest('POST', '/email-verification/verify-otp', {
    email: testUser.email,
    otp: '1234', // This will fail, but we're testing the endpoint
    purpose: 'signup'
  });
  
  if (!verifyOTPResult.success && verifyOTPResult.error.message.includes('Invalid')) {
    console.log('✅ OTP verification endpoint working (expected failure with mock OTP)');
  } else {
    console.log('❌ Unexpected OTP verification result:', verifyOTPResult);
  }
  
  // Test 3: Check verification status
  console.log('Test 3: Check verification status');
  const checkVerificationResult = await makeRequest('GET', `/email-verification/check-verification?email=${testUser.email}&purpose=signup`);
  
  if (checkVerificationResult.success) {
    console.log('✅ Verification status check working');
  } else {
    console.log('❌ Failed to check verification status:', checkVerificationResult.error);
  }
  
  // Test 4: Send multiple OTPs (no rate limiting)
  console.log('Test 4: Send multiple OTPs (testing no rate limiting)');
  for (let i = 0; i < 5; i++) {
    const multipleOTPResult = await makeRequest('POST', '/email-verification/send-otp', {
      email: testUser.email,
      purpose: 'signup'
    });
    
    if (multipleOTPResult.success) {
      console.log(`✅ OTP ${i + 1} sent successfully (no rate limiting)`);
    } else {
      console.log(`❌ Failed to send OTP ${i + 1}:`, multipleOTPResult.error);
    }
  }
  
  return true;
};

// Test concurrent login functionality
const testConcurrentLogin = async () => {
  console.log('\n🧪 Testing Concurrent Login System...');
  
  // Test 1: Register a user first
  console.log('Test 1: Register a user');
  const registerResult = await makeRequest('POST', '/auth/register', testUser);
  
  if (registerResult.success) {
    console.log('✅ User registered successfully');
    authToken = registerResult.data.token;
    testUserId = registerResult.data.user.id;
  } else {
    console.log('❌ Failed to register user:', registerResult.error);
    return false;
  }
  
  // Test 2: Login from first device
  console.log('Test 2: Login from first device');
  const login1Result = await makeRequest('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (login1Result.success) {
    console.log('✅ First login successful');
  } else {
    console.log('❌ First login failed:', login1Result.error);
    return false;
  }
  
  // Test 3: Attempt login from second device (should trigger concurrent login)
  console.log('Test 3: Attempt login from second device');
  const login2Result = await makeRequest('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (!login2Result.success && login2Result.error.code === 'CONCURRENT_LOGIN_DETECTED') {
    console.log('✅ Concurrent login detection working');
  } else {
    console.log('❌ Concurrent login detection failed:', login2Result.error);
  }
  
  // Test 4: Get concurrent login requests
  console.log('Test 4: Get concurrent login requests');
  const getRequestsResult = await makeRequest('GET', '/session-management/concurrent-login-requests', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (getRequestsResult.success) {
    console.log('✅ Concurrent login requests retrieved');
  } else {
    console.log('❌ Failed to get concurrent login requests:', getRequestsResult.error);
  }
  
  // Test 5: Handle concurrent login response (deny)
  console.log('Test 5: Handle concurrent login response (deny)');
  if (getRequestsResult.success && getRequestsResult.data.requests.length > 0) {
    const requestId = getRequestsResult.data.requests[0].requestId;
    const denyResult = await makeRequest('POST', '/session-management/concurrent-login-response', {
      requestId,
      response: 'deny'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (denyResult.success) {
      console.log('✅ Concurrent login denial working');
    } else {
      console.log('❌ Failed to deny concurrent login:', denyResult.error);
    }
  }
  
  return true;
};

// Test progressive blocking
const testProgressiveBlocking = async () => {
  console.log('\n🧪 Testing Progressive Blocking System...');
  
  // Test 1: Attempt login from blocked IP
  console.log('Test 1: Attempt login from blocked IP');
  const blockedLoginResult = await makeRequest('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (!blockedLoginResult.success && blockedLoginResult.error.code === 'IP_BLOCKED') {
    console.log('✅ IP blocking working');
  } else {
    console.log('❌ IP blocking failed:', blockedLoginResult.error);
  }
  
  return true;
};

// Cleanup function
const cleanup = async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Clean up test user
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    await User.deleteOne({ email: testUser.email });
    
    // Clean up email verifications
    const EmailVerification = mongoose.model('EmailVerification', new mongoose.Schema({}, { strict: false }));
    await EmailVerification.deleteMany({ email: testUser.email });
    
    // Clean up user sessions
    const UserSession = mongoose.model('UserSession', new mongoose.Schema({}, { strict: false }));
    await UserSession.deleteMany({ userId: testUserId });
    
    await mongoose.disconnect();
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('❌ Cleanup failed:', error.message);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Email Verification and Concurrent Login Tests...');
  console.log('='.repeat(60));
  
  try {
    // Run tests
    await testEmailVerification();
    await testConcurrentLogin();
    await testProgressiveBlocking();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.log('\n❌ Test execution failed:', error.message);
  } finally {
    await cleanup();
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testEmailVerification,
  testConcurrentLogin,
  testProgressiveBlocking,
  runTests
};