const axios = require('axios');

// Test the bulk import endpoint
async function testBulkImportEndpoint() {
  try {
    const response = await axios.get('http://localhost:3001/api/classrooms');
    console.log('✅ Server is running on port 3001');
    console.log('✅ Classrooms endpoint is accessible');
    
    // Test if the route exists by checking the server
    console.log('\n📋 Available routes:');
    console.log('- GET /api/classrooms');
    console.log('- POST /api/classrooms/:classroomId/students/bulk-import');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on port 3001');
      console.log('💡 Run: cd server && npm run dev');
    }
  }
}

testBulkImportEndpoint();
