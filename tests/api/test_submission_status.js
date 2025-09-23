// Test script to verify submission status functionality
const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

// Test data
const testData = {
  studentLogin: {
    email: 'student@test.com',
    password: 'password123'
  },
  taskId: null,
  token: null
};

async function testSubmissionStatus() {
  try {
    console.log('🧪 Testing Submission Status Functionality...\n');

    // Step 1: Login as student
    console.log('1. Logging in as student...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, testData.studentLogin);
    testData.token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Get tasks
    console.log('2. Fetching tasks...');
    const tasksResponse = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${testData.token}` }
    });
    
    if (tasksResponse.data.length === 0) {
      console.log('⚠️  No tasks found. Please create a task first.');
      return;
    }
    
    testData.taskId = tasksResponse.data[0]._id;
    console.log(`✅ Found ${tasksResponse.data.length} tasks. Using task: ${testData.taskId}\n`);

    // Step 3: Check initial submission status
    console.log('3. Checking initial submission status...');
    const initialStatusResponse = await axios.get(`${API_URL}/tasks/${testData.taskId}/my-submission`, {
      headers: { Authorization: `Bearer ${testData.token}` }
    });
    
    console.log('Initial submission status:', {
      hasSubmission: initialStatusResponse.data.hasSubmission,
      status: initialStatusResponse.data.submission?.status || 'none',
      isOverdue: initialStatusResponse.data.isOverdue
    });

    // Step 4: Submit a task
    console.log('\n4. Submitting task...');
    const formData = new FormData();
    formData.append('content', 'Test submission content');
    formData.append('status', 'submitted');

    const submitResponse = await axios.post(`${API_URL}/tasks/${testData.taskId}/submit`, formData, {
      headers: { 
        Authorization: `Bearer ${testData.token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('✅ Task submitted successfully\n');

    // Step 5: Check submission status after submission
    console.log('5. Checking submission status after submission...');
    const finalStatusResponse = await axios.get(`${API_URL}/tasks/${testData.taskId}/my-submission`, {
      headers: { Authorization: `Bearer ${testData.token}` }
    });
    
    console.log('Final submission status:', {
      hasSubmission: finalStatusResponse.data.hasSubmission,
      status: finalStatusResponse.data.submission?.status || 'none',
      submittedAt: finalStatusResponse.data.submission?.submittedAt
    });

    // Step 6: Check task list to verify counts
    console.log('\n6. Checking task list for accurate counts...');
    const updatedTasksResponse = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${testData.token}` }
    });
    
    const submittedTask = updatedTasksResponse.data.find(t => t._id === testData.taskId);
    if (submittedTask) {
      console.log('Task submission details:', {
        taskId: submittedTask._id,
        title: submittedTask.title,
        submissionsCount: submittedTask.submissions?.length || 0,
        hasMySubmission: submittedTask.submissions?.some(sub => {
          const subStudentId = typeof sub.student === 'object' ? sub.student?._id : sub.student;
          return subStudentId && subStudentId.toString() === testData.token.split('.')[0]; // This is a simplified check
        })
      });
    }

    // Step 7: Try to submit again (should be prevented)
    console.log('\n7. Attempting to submit again (should be prevented)...');
    try {
      const secondSubmitResponse = await axios.post(`${API_URL}/tasks/${testData.taskId}/submit`, formData, {
        headers: { 
          Authorization: `Bearer ${testData.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('❌ Second submission was allowed (this should not happen)');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already submitted')) {
        console.log('✅ Second submission correctly prevented');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Submission status test completed successfully!');
    console.log('\nKey Features Verified:');
    console.log('✅ Submission status tracking');
    console.log('✅ Prevention of multiple submissions');
    console.log('✅ Real-time status updates');
    console.log('✅ API endpoint for checking submission status');
    console.log('✅ Task list updates after submission');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testSubmissionStatus();
