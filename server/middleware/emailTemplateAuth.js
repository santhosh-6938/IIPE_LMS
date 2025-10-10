const EmailTemplate = require('../models/EmailTemplate');

/**
 * Middleware to ensure only admin users can access email template operations
 * This provides an additional layer of security beyond route-level authorization
 */
const emailTemplateAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.user || req.user.role !== 'admin') {
      console.warn(`Unauthorized access attempt to email templates by user: ${req.user?.email || 'unknown'}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only administrators can manage email templates.'
      });
    }

    // Log admin access for audit trail
    console.log(`Admin ${req.user.email} accessing email template management`);

    // Additional security: Check if user is still active
    if (!req.user.isActive) {
      console.warn(`Inactive admin user attempting to access email templates: ${req.user.email}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied. Account is inactive.'
      });
    }

    next();
  } catch (error) {
    console.error('Error in email template auth middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication'
    });
  }
};

/**
 * Middleware to validate template access for email sending operations
 * Ensures templates exist and are accessible for email operations
 */
const validateTemplateAccess = async (req, res, next) => {
  try {
    const { templateName } = req.params || req.body;
    
    if (!templateName) {
      return res.status(400).json({
        success: false,
        error: 'Template name is required'
      });
    }

    // Check if template exists and is active
    const template = await EmailTemplate.findOne({ 
      templateName, 
      isActive: true 
    });

    if (!template) {
      console.error(`SECURITY ALERT: Attempt to access non-existent template: ${templateName}`);
      return res.status(404).json({
        success: false,
        error: 'Email template not found'
      });
    }

    // Add template to request for use in route handlers
    req.template = template;
    next();
  } catch (error) {
    console.error('Error validating template access:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during template validation'
    });
  }
};

module.exports = {
  emailTemplateAuth,
  validateTemplateAccess
};
