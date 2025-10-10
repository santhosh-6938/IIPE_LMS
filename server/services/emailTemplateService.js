const EmailTemplate = require('../models/EmailTemplate');

/**
 * Email Template Service
 * Handles dynamic email template rendering from MongoDB database only
 * All templates must be stored in database - no hardcoded fallbacks for security
 */

// No hardcoded templates - all templates must be stored in MongoDB database
// This ensures complete security and admin-only access to email content

/**
 * Get email template from database only (no fallbacks for security)
 * @param {string} templateName - Name of the template
 * @returns {Object} Template object with subject, bodyHtml, bodyText
 * @throws {Error} If template is not found in database
 */
const getEmailTemplate = async (templateName) => {
  try {
    // Get template from database only
    const template = await EmailTemplate.getTemplate(templateName);
    
    if (!template) {
      const errorMsg = `SECURITY ALERT: Email template '${templateName}' not found in database. All templates must be stored in MongoDB for security.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    return {
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      bodyText: template.bodyText
    };
  } catch (error) {
    console.error(`Error getting email template '${templateName}':`, error);
    throw error;
  }
};

/**
 * Render email template with variables
 * @param {string} templateName - Name of the template
 * @param {Object} variables - Variables to replace in template
 * @returns {Object} Rendered template with subject, bodyHtml, bodyText
 */
const renderEmailTemplate = async (templateName, variables = {}) => {
  try {
    const template = await getEmailTemplate(templateName);
    
    // Replace placeholders in all template fields
    const rendered = {
      subject: replacePlaceholders(template.subject, variables),
      bodyHtml: replacePlaceholders(template.bodyHtml, variables),
      bodyText: replacePlaceholders(template.bodyText, variables)
    };

    return rendered;
  } catch (error) {
    console.error(`Error rendering email template '${templateName}':`, error);
    throw error;
  }
};

/**
 * Replace placeholders in template string
 * @param {string} template - Template string with placeholders
 * @param {Object} variables - Variables to replace
 * @returns {string} Rendered string
 */
const replacePlaceholders = (template, variables) => {
  let result = template;
  
  Object.keys(variables).forEach(key => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, variables[key] || '');
  });

  return result;
};

/**
 * Create or update email template
 * @param {Object} templateData - Template data
 * @returns {Object} Created/updated template
 */
const createOrUpdateTemplate = async (templateData) => {
  try {
    const { templateName, ...data } = templateData;
    
    const template = await EmailTemplate.findOneAndUpdate(
      { templateName },
      { ...data, updatedAt: new Date() },
      { 
        upsert: true, 
        new: true, 
        runValidators: true 
      }
    );

    return template;
  } catch (error) {
    console.error('Error creating/updating email template:', error);
    throw error;
  }
};

/**
 * Get all email templates
 * @returns {Array} List of all templates
 */
const getAllTemplates = async () => {
  try {
    return await EmailTemplate.find({ isActive: true }).sort({ templateName: 1 });
  } catch (error) {
    console.error('Error getting all email templates:', error);
    throw error;
  }
};

/**
 * Delete email template (soft delete)
 * @param {string} templateName - Name of template to delete
 * @returns {Object} Deleted template
 */
const deleteTemplate = async (templateName) => {
  try {
    return await EmailTemplate.findOneAndUpdate(
      { templateName },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
  } catch (error) {
    console.error('Error deleting email template:', error);
    throw error;
  }
};

module.exports = {
  getEmailTemplate,
  renderEmailTemplate,
  createOrUpdateTemplate,
  getAllTemplates,
  deleteTemplate
};
