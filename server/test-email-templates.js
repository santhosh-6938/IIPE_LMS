const mongoose = require('mongoose');
require('dotenv').config();

const { renderEmailTemplate, getAllTemplates } = require('./services/emailTemplateService');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Test data for different email templates
const testData = {
  notification: {
    userName: 'John Doe',
    title: 'New Assignment Posted',
    message: 'Your teacher has posted a new assignment in Mathematics class.'
  },
  task_assignment: {
    studentName: 'Jane Smith',
    taskTitle: 'Linear Algebra Problem Set',
    classroomName: 'Mathematics 101',
    teacherName: 'Dr. Johnson'
  },
  task_submission: {
    teacherName: 'Dr. Johnson',
    studentName: 'Jane Smith',
    taskTitle: 'Linear Algebra Problem Set',
    isAutoSubmission: 'Auto-',
    isAutoSubmissionText: 'The system has automatically submitted draft submissions for a task:',
    isAutoSubmissionColor: '#dc3545',
    isAutoSubmissionLabel: 'Auto-submitted by:',
    isAutoSubmissionWarning: '<p style="color: #dc3545; font-weight: bold;">⚠️ This submission was automatically submitted due to the deadline passing.</p>',
    isAutoSubmissionPlural: 's'
  },
  auto_submission_notification: {
    studentName: 'Jane Smith',
    taskTitle: 'Linear Algebra Problem Set',
    classroomName: 'Mathematics 101'
  },
  password_reset: {
    userName: 'John Doe',
    otp: '123456',
    resetLink: 'https://example.com/reset-password?token=abc123'
  },
  teacher_welcome: {
    teacherName: 'Dr. Johnson',
    teacherEmail: 'dr.johnson@example.com',
    tempPassword: 'TempPass123!',
    createdByName: 'Admin User'
  }
};

// Test function
const testEmailTemplates = async () => {
  try {
    console.log('🧪 Testing Email Template System\n');

    // Test 1: Get all templates
    console.log('1. Testing getAllTemplates()...');
    const allTemplates = await getAllTemplates();
    console.log(`✅ Found ${allTemplates.length} templates in database`);
    allTemplates.forEach(template => {
      console.log(`   - ${template.templateName}: ${template.description}`);
    });
    console.log('');

    // Test 2: Test each template rendering
    console.log('2. Testing template rendering...');
    
    for (const [templateName, variables] of Object.entries(testData)) {
      try {
        console.log(`\n   Testing ${templateName} template:`);
        const rendered = await renderEmailTemplate(templateName, variables);
        
        console.log(`   ✅ Subject: ${rendered.subject}`);
        console.log(`   ✅ HTML Length: ${rendered.bodyHtml.length} characters`);
        console.log(`   ✅ Text Length: ${rendered.bodyText.length} characters`);
        
        // Check if placeholders were replaced
        const hasPlaceholders = rendered.bodyHtml.includes('{{') || rendered.bodyText.includes('{{');
        if (hasPlaceholders) {
          console.log(`   ⚠️  Warning: Some placeholders may not have been replaced`);
        } else {
          console.log(`   ✅ All placeholders replaced successfully`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error testing ${templateName}: ${error.message}`);
      }
    }

    // Test 3: Test with missing template (should fail with security alert)
    console.log('\n3. Testing security behavior for missing templates...');
    try {
      const rendered = await renderEmailTemplate('nonexistent_template', { test: 'value' });
      console.log('   ❌ Should have failed but got result:', rendered);
    } catch (error) {
      console.log('   ✅ Correctly failed for nonexistent template with security alert:', error.message);
    }

    // Test 4: Test with missing variables
    console.log('\n4. Testing with missing variables...');
    try {
      const rendered = await renderEmailTemplate('notification', { userName: 'Test User' });
      console.log('   ✅ Rendered with missing variables (should show empty placeholders)');
      console.log(`   Subject: ${rendered.subject}`);
    } catch (error) {
      console.log('   ❌ Error with missing variables:', error.message);
    }

    console.log('\n🎉 Email template system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testEmailTemplates();
}

module.exports = { testEmailTemplates };
