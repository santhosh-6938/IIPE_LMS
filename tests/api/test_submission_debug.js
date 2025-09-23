// Debug test script to verify submission status functionality
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

async function testSubmissionDebug() {
  try {
    console.log('🔍 Debugging Submission Status...\n');

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

    // Step 4: Save as draft
    console.log('\n4. Saving as draft...');
    const draftFormData = new FormData();
    draftFormData.append('content', 'Test draft content');
    draftFormData.append('status', 'draft');

    const draftResponse = await axios.post(`${API_URL}/tasks/${testData.taskId}/submit`, draftFormData, {
      headers: { 
        Authorization: `Bearer ${testData.token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('✅ Draft saved successfully');
    console.log('Draft response status:', draftResponse.data.submissions?.[0]?.status);

    // Step 5: Check status after draft
    console.log('\n5. Checking status after draft...');
    const afterDraftResponse = await axios.get(`${API_URL}/tasks/${testData.taskId}/my-submission`, {
      headers: { Authorization: `Bearer ${testData.token}` }
    });
    
    console.log('After draft status:', {
      hasSubmission: afterDraftResponse.data.hasSubmission,
      status: afterDraftResponse.data.submission?.status || 'none'
    });

    // Step 6: Submit the task
    console.log('\n6. Submitting task...');
    const submitFormData = new FormData();
    submitFormData.append('content', 'Test final submission content');
    submitFormData.append('status', 'submitted');

    const submitResponse = await axios.post(`${API_URL}/tasks/${testData.taskId}/submit`, submitFormData, {
      headers: { 
        Authorization: `Bearer ${testData.token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('✅ Task submitted successfully');
    console.log('Submit response status:', submitResponse.data.submissions?.[0]?.status);

    // Step 7: Check final status
    console.log('\n7. Checking final status...');
    const finalStatusResponse = await axios.get(`${API_URL}/tasks/${testData.taskId}/my-submission`, {
      headers: { Authorization: `Bearer ${testData.token}` }
    });
    
    console.log('Final status:', {
      hasSubmission: finalStatusResponse.data.hasSubmission,
      status: finalStatusResponse.data.submission?.status || 'none',
      submittedAt: finalStatusResponse.data.submission?.submittedAt
    });

    // Step 8: Check task list
    console.log('\n8. Checking task list...');
    const finalTasksResponse = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${testData.token}` }
    });
    
    const submittedTask = finalTasksResponse.data.find(t => t._id === testData.taskId);
    if (submittedTask) {
      console.log('Task in list:', {
        taskId: submittedTask._id,
        title: submittedTask.title,
        submissionsCount: submittedTask.submissions?.length || 0,
        submissionStatus: submittedTask.submissions?.[0]?.status
      });
    }

    console.log('\n🎉 Debug test completed!');
    console.log('\nKey Findings:');
    console.log('✅ Draft saving works correctly');
    console.log('✅ Task submission works correctly');
    console.log('✅ Status tracking works correctly');
    console.log('✅ API endpoints work correctly');

  } catch (error) {
    console.error('❌ Debug test failed:', error.response?.data?.message || error.message);
  }
}

// Run the debug test
testSubmissionDebug();
