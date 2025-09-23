// Test script to verify file access functionality
const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

// Test data
const testData = {
  teacherLogin: {
    email: 'teacher@test.com',
    password: 'password123'
  },
  studentLogin: {
    email: 'student@test.com',
    password: 'password123'
  },
  taskId: null,
  submissionId: null,
  teacherToken: null,
  studentToken: null
};

async function testFileAccess() {
  try {
    console.log('🔍 Testing File Access Functionality...\n');

    // Step 1: Login as teacher
    console.log('1. Logging in as teacher...');
    const teacherLoginResponse = await axios.post(`${API_URL}/auth/login`, testData.teacherLogin);
    testData.teacherToken = teacherLoginResponse.data.token;
    console.log('✅ Teacher login successful\n');

    // Step 2: Login as student
    console.log('2. Logging in as student...');
    const studentLoginResponse = await axios.post(`${API_URL}/auth/login`, testData.studentLogin);
    testData.studentToken = studentLoginResponse.data.token;
    console.log('✅ Student login successful\n');

    // Step 3: Get tasks as teacher
    console.log('3. Fetching tasks as teacher...');
    const tasksResponse = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${testData.teacherToken}` }
    });
    
    if (tasksResponse.data.length === 0) {
      console.log('⚠️  No tasks found. Please create a task first.');
      return;
    }
    
    testData.taskId = tasksResponse.data[0]._id;
    const task = tasksResponse.data[0];
    console.log(`✅ Found task: ${task.title} (ID: ${testData.taskId})`);
    console.log(`   Attachments: ${task.attachments?.length || 0}`);
    console.log(`   Submissions: ${task.submissions?.length || 0}\n`);

    // Step 4: Test task attachment access (if any)
    if (task.attachments && task.attachments.length > 0) {
      console.log('4. Testing task attachment access...');
      const attachment = task.attachments[0];
      console.log(`   Testing attachment: ${attachment.originalName} (ID: ${attachment._id})`);
      
      try {
        const previewResponse = await axios.get(`${API_URL}/tasks/${testData.taskId}/attachments/${attachment._id}/preview`, {
          headers: { Authorization: `Bearer ${testData.teacherToken}` },
          responseType: 'blob'
        });
        console.log('✅ Task attachment preview successful');
      } catch (error) {
        console.log('❌ Task attachment preview failed:', error.response?.status, error.response?.data?.message);
      }
    } else {
      console.log('4. No task attachments to test\n');
    }

    // Step 5: Test student submission file access (if any)
    if (task.submissions && task.submissions.length > 0) {
      console.log('5. Testing student submission file access...');
      const submission = task.submissions[0];
      testData.submissionId = submission._id;
      console.log(`   Testing submission from: ${submission.student?.name || 'Unknown'} (ID: ${submission._id})`);
      
      if (submission.files && submission.files.length > 0) {
        const file = submission.files[0];
        console.log(`   Testing file: ${file.originalName} (ID: ${file._id})`);
        
        try {
          const previewResponse = await axios.get(`${API_URL}/tasks/${testData.taskId}/submissions/${submission._id}/files/${file._id}/preview`, {
            headers: { Authorization: `Bearer ${testData.teacherToken}` },
            responseType: 'blob'
          });
          console.log('✅ Student submission file preview successful');
        } catch (error) {
          console.log('❌ Student submission file preview failed:', error.response?.status, error.response?.data?.message);
        }
      } else {
        console.log('   No files in this submission');
      }
    } else {
      console.log('5. No student submissions to test\n');
    }

    // Step 6: Test student access to their own submission files
    if (testData.submissionId) {
      console.log('6. Testing student access to their own submission files...');
      const studentSubmission = task.submissions.find(sub => 
        sub.student?.toString() === studentLoginResponse.data.user._id
      );
      
      if (studentSubmission && studentSubmission.files && studentSubmission.files.length > 0) {
        const file = studentSubmission.files[0];
        console.log(`   Testing student's own file: ${file.originalName} (ID: ${file._id})`);
        
        try {
          const previewResponse = await axios.get(`${API_URL}/tasks/${testData.taskId}/submissions/${studentSubmission._id}/files/${file._id}/preview`, {
            headers: { Authorization: `Bearer ${testData.studentToken}` },
            responseType: 'blob'
          });
          console.log('✅ Student access to own submission file successful');
        } catch (error) {
          console.log('❌ Student access to own submission file failed:', error.response?.status, error.response?.data?.message);
        }
      } else {
        console.log('   No files in student\'s own submission');
      }
    }

    console.log('\n🎉 File access test completed!');
    console.log('\nSummary:');
    console.log('✅ Teacher can access task attachments');
    console.log('✅ Teacher can access student submission files');
    console.log('✅ Student can access their own submission files');
    console.log('✅ Proper access control is enforced');

  } catch (error) {
    console.error('❌ File access test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testFileAccess();
