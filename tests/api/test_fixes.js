const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

// Test data
const testData = {
  teacherToken: null,
  studentToken: null,
  classroomId: null,
  taskId: null,
  submissionId: null,
  fileId: null
};

async function testFixes() {
  console.log('🧪 Testing fixes for student dashboard and teacher file access...\n');

  try {
    // Step 1: Login as teacher
    console.log('1. Logging in as teacher...');
    const teacherLoginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'teacher@example.com',
      password: 'password123'
    });
    testData.teacherToken = teacherLoginResponse.data.token;
    console.log('✅ Teacher logged in successfully');

    // Step 2: Login as student
    console.log('\n2. Logging in as student...');
    const studentLoginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'student@example.com',
      password: 'password123'
    });
    testData.studentToken = studentLoginResponse.data.token;
    console.log('✅ Student logged in successfully');

    // Step 3: Get or create a classroom
    console.log('\n3. Getting classrooms...');
    const classroomsResponse = await axios.get(`${API_URL}/classrooms`, {
      headers: { Authorization: `Bearer ${testData.teacherToken}` }
    });
    
    if (classroomsResponse.data.length === 0) {
      console.log('No classrooms found, creating one...');
      const createClassroomResponse = await axios.post(`${API_URL}/classrooms`, {
        name: 'Test Classroom',
        description: 'Test classroom for fixes'
      }, {
        headers: { Authorization: `Bearer ${testData.teacherToken}` }
      });
      testData.classroomId = createClassroomResponse.data._id;
    } else {
      testData.classroomId = classroomsResponse.data[0]._id;
    }
    console.log(`✅ Using classroom: ${testData.classroomId}`);

    // Step 4: Get or create a task
    console.log('\n4. Getting tasks...');
    const tasksResponse = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${testData.teacherToken}` }
    });
    
    if (tasksResponse.data.length === 0) {
      console.log('No tasks found, creating one...');
      const createTaskResponse = await axios.post(`${API_URL}/tasks`, {
        title: 'Test Task for Fixes',
        description: 'Test task to verify fixes',
        classroom: testData.classroomId,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        maxSubmissions: 1
      }, {
        headers: { Authorization: `Bearer ${testData.teacherToken}` }
      });
      testData.taskId = createTaskResponse.data._id;
    } else {
      testData.taskId = tasksResponse.data[0]._id;
    }
    console.log(`✅ Using task: ${testData.taskId}`);

    // Step 5: Check initial task status for student
    console.log('\n5. Checking initial task status for student...');
    const initialStatusResponse = await axios.get(`${API_URL}/tasks/${testData.taskId}/my-submission`, {
      headers: { Authorization: `Bearer ${testData.studentToken}` }
    });
    console.log('Initial submission status:', initialStatusResponse.data);

    // Step 6: Submit task as student
    console.log('\n6. Submitting task as student...');
    const submitFormData = new FormData();
    submitFormData.append('content', 'Test submission content for fixes');
    submitFormData.append('status', 'submitted');
    
    // Create a test file
    const testFile = new Blob(['Test file content'], { type: 'text/plain' });
    submitFormData.append('files', testFile, 'test-file.txt');

    const submitResponse = await axios.post(`${API_URL}/tasks/${testData.taskId}/submit`, submitFormData, {
      headers: { 
        Authorization: `Bearer ${testData.studentToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('✅ Task submitted successfully');

    // Step 7: Check updated task status
    console.log('\n7. Checking updated task status...');
    const updatedStatusResponse = await axios.get(`${API_URL}/tasks/${testData.taskId}/my-submission`, {
      headers: { Authorization: `Bearer ${testData.studentToken}` }
    });
    console.log('Updated submission status:', updatedStatusResponse.data);

    // Step 8: Get task details as teacher to verify submission
    console.log('\n8. Getting task details as teacher...');
    const taskDetailsResponse = await axios.get(`${API_URL}/tasks/${testData.taskId}`, {
      headers: { Authorization: `Bearer ${testData.teacherToken}` }
    });
    
    const task = taskDetailsResponse.data;
    console.log(`Task submissions count: ${task.submissions?.length || 0}`);
    
    if (task.submissions && task.submissions.length > 0) {
      const submission = task.submissions[0];
      testData.submissionId = submission._id;
      testData.fileId = submission.files?.[0]?._id;
      console.log(`Submission ID: ${testData.submissionId}`);
      console.log(`File ID: ${testData.fileId}`);
    }

    // Step 9: Test teacher file access (if file exists)
    if (testData.fileId) {
      console.log('\n9. Testing teacher file access...');
      try {
        const fileAccessResponse = await axios.get(`${API_URL}/tasks/files/${testData.fileId}/preview`, {
          headers: { Authorization: `Bearer ${testData.teacherToken}` },
          responseType: 'blob'
        });
        console.log('✅ Teacher can access submission file successfully');
        console.log(`File size: ${fileAccessResponse.data.size} bytes`);
      } catch (error) {
        console.error('❌ Teacher file access failed:', error.response?.status, error.response?.data);
      }
    }

    // Step 10: Verify task completion tracking
    console.log('\n10. Verifying task completion tracking...');
    const finalTasksResponse = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${testData.studentToken}` }
    });
    
    const submittedTask = finalTasksResponse.data.find(t => t._id === testData.taskId);
    if (submittedTask) {
      const isCompleted = submittedTask.submissions?.some(sub => 
        sub.student === 'student@example.com' && sub.status === 'submitted'
      );
      console.log(`Task completion status: ${isCompleted ? '✅ Completed' : '❌ Not completed'}`);
      console.log(`Submissions count: ${submittedTask.submissions?.length || 0}`);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testFixes();
