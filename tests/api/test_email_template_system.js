const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:8000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rbac-education';

// Test configuration
const testAdmin = {
  name: 'Test Admin',
  email: 'admin@example.com',
  password: 'password123',
  role: 'admin'
};

let authToken = null;
let testAdminId = null;

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

// Test email template system
const testEmailTemplateSystem = async () => {
  console.log('\n🧪 Testing Email Template System...');
  
  // Test 1: Get all email templates
  console.log('Test 1: Get all email templates');
  const getAllTemplatesResult = await makeRequest('GET', '/email-templates', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (getAllTemplatesResult.success) {
    console.log('✅ Successfully retrieved all email templates');
    console.log(`   Found ${getAllTemplatesResult.data.templates.length} templates`);
  } else {
    console.log('❌ Failed to get email templates:', getAllTemplatesResult.error);
    return false;
  }
  
  // Test 2: Get specific template
  console.log('Test 2: Get specific email template');
  const getTemplateResult = await makeRequest('GET', '/email-templates/email_verification_signup', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (getTemplateResult.success) {
    console.log('✅ Successfully retrieved specific email template');
    console.log(`   Template: ${getTemplateResult.data.template.templateName}`);
    console.log(`   Subject: ${getTemplateResult.data.template.subject}`);
  } else {
    console.log('❌ Failed to get specific template:', getTemplateResult.error);
  }
  
  // Test 3: Preview template with variables
  console.log('Test 3: Preview template with variables');
  const previewResult = await makeRequest('POST', '/email-templates/email_verification_signup/preview', {
    variables: {
      userName: 'John Doe',
      otp: '1234'
    }
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (previewResult.success) {
    console.log('✅ Successfully previewed template with variables');
    console.log(`   Rendered subject: ${previewResult.data.preview.subject}`);
  } else {
    console.log('❌ Failed to preview template:', previewResult.error);
  }
  
  // Test 4: Update template
  console.log('Test 4: Update email template');
  const updateTemplateResult = await makeRequest('PUT', '/email-templates/email_verification_signup', {
    subject: 'Updated: Verify Your Email - IIPE LMS Registration',
    description: 'Updated email verification template for user registration',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">IIPE LMS</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{userName}},</h2>
          <p style="color: #666; margin-bottom: 20px;">
            Please verify your email address to complete your registration.
          </p>
          <div style="background: white; border: 2px dashed #667eea; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">{{otp}}</span>
          </div>
          <p style="color: #e74c3c; font-weight: bold; margin: 20px 0;">
            ⚠️ This code will expire in 2 minutes
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you didn't request this verification, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 IIPE LMS. All rights reserved.</p>
        </div>
      </div>
    `,
    bodyText: `
      IIPE LMS - Email Verification
      
      Hello {{userName}},
      
      Please verify your email address to complete your registration.
      
      Your verification code is: {{otp}}
      
      ⚠️ This code will expire in 2 minutes
      
      If you didn't request this verification, please ignore this email.
      
      © 2024 IIPE LMS. All rights reserved.
    `,
    variables: ['userName', 'otp']
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (updateTemplateResult.success) {
    console.log('✅ Successfully updated email template');
    console.log(`   Updated subject: ${updateTemplateResult.data.template.subject}`);
  } else {
    console.log('❌ Failed to update template:', updateTemplateResult.error);
  }
  
  // Test 5: Create new template
  console.log('Test 5: Create new email template');
  const createTemplateResult = await makeRequest('POST', '/email-templates', {
    templateName: 'test_template',
    subject: 'Test Template - {{title}}',
    description: 'Test email template for testing purposes',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>{{title}}</h1>
        <p>{{message}}</p>
        <p>From: {{senderName}}</p>
      </div>
    `,
    bodyText: `
      {{title}}
      
      {{message}}
      
      From: {{senderName}}
    `,
    variables: ['title', 'message', 'senderName']
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (createTemplateResult.success) {
    console.log('✅ Successfully created new email template');
    console.log(`   Created template: ${createTemplateResult.data.template.templateName}`);
  } else {
    console.log('❌ Failed to create template:', createTemplateResult.error);
  }
  
  // Test 6: Delete template (soft delete)
  console.log('Test 6: Delete email template');
  const deleteTemplateResult = await makeRequest('DELETE', '/email-templates/test_template', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (deleteTemplateResult.success) {
    console.log('✅ Successfully deleted email template');
  } else {
    console.log('❌ Failed to delete template:', deleteTemplateResult.error);
  }
  
  return true;
};

// Test email verification with database templates
const testEmailVerificationWithTemplates = async () => {
  console.log('\n🧪 Testing Email Verification with Database Templates...');
  
  // Test 1: Send OTP for signup
  console.log('Test 1: Send OTP for signup using database template');
  const sendOTPResult = await makeRequest('POST', '/email-verification/send-otp', {
    email: 'test@example.com',
    purpose: 'signup'
  });
  
  if (sendOTPResult.success) {
    console.log('✅ OTP sent successfully using database template');
  } else {
    console.log('❌ Failed to send OTP:', sendOTPResult.error);
    return false;
  }
  
  // Test 2: Send OTP for login
  console.log('Test 2: Send OTP for login using database template');
  const sendLoginOTPResult = await makeRequest('POST', '/email-verification/send-otp', {
    email: 'test@example.com',
    purpose: 'login'
  });
  
  if (sendLoginOTPResult.success) {
    console.log('✅ Login OTP sent successfully using database template');
  } else {
    console.log('❌ Failed to send login OTP:', sendLoginOTPResult.error);
  }
  
  return true;
};

// Cleanup function
const cleanup = async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Clean up test templates
    const EmailTemplate = mongoose.model('EmailTemplate', new mongoose.Schema({}, { strict: false }));
    await EmailTemplate.deleteOne({ templateName: 'test_template' });
    
    // Reset email verification template to original
    await EmailTemplate.findOneAndUpdate(
      { templateName: 'email_verification_signup' },
      {
        subject: 'Verify Your Email - IIPE LMS Registration',
        description: 'Email verification template for user registration'
      }
    );
    
    await mongoose.disconnect();
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('❌ Cleanup failed:', error.message);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Email Template System Tests...');
  console.log('='.repeat(60));
  
  try {
    // Note: In a real test environment, you would need to authenticate as admin first
    // For this test, we'll assume the authToken is available
    
    await testEmailTemplateSystem();
    await testEmailVerificationWithTemplates();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All email template tests completed!');
    
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
  testEmailTemplateSystem,
  testEmailVerificationWithTemplates,
  runTests
};
