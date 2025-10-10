const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { emailTemplateAuth, validateTemplateAccess } = require('../middleware/emailTemplateAuth');
const { 
  getAllTemplates, 
  getEmailTemplate, 
  createOrUpdateTemplate, 
  deleteTemplate 
} = require('../services/emailTemplateService');

const router = express.Router();

// Get all email templates (admin only) - with additional security middleware
router.get('/', auth, authorize(['admin']), emailTemplateAuth, async (req, res) => {
  try {
    const templates = await getAllTemplates();
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email templates'
    });
  }
});

// Get specific email template (admin only) - with additional security middleware
router.get('/:templateName', auth, authorize(['admin']), emailTemplateAuth, validateTemplateAccess, async (req, res) => {
  try {
    const { templateName } = req.params;
    
    // Use admin-specific method to get full template data
    const EmailTemplate = require('../models/EmailTemplate');
    const template = await EmailTemplate.getTemplateForAdmin(templateName);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Email template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email template'
    });
  }
});

// Create or update email template (admin only) - with additional security middleware
router.post('/', auth, authorize(['admin']), emailTemplateAuth, async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    const template = await createOrUpdateTemplate(templateData);
    
    res.status(201).json({
      success: true,
      data: template,
      message: 'Email template created/updated successfully'
    });
  } catch (error) {
    console.error('Error creating/updating email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create/update email template'
    });
  }
});

// Update specific email template (admin only) - with additional security middleware
router.put('/:templateName', auth, authorize(['admin']), emailTemplateAuth, validateTemplateAccess, async (req, res) => {
  try {
    const { templateName } = req.params;
    const templateData = {
      ...req.body,
      templateName,
      updatedBy: req.user.id
    };

    const template = await createOrUpdateTemplate(templateData);
    
    res.json({
      success: true,
      data: template,
      message: 'Email template updated successfully'
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update email template'
    });
  }
});

// Delete email template (soft delete) (admin only) - with additional security middleware
router.delete('/:templateName', auth, authorize(['admin']), emailTemplateAuth, validateTemplateAccess, async (req, res) => {
  try {
    const { templateName } = req.params;
    const template = await deleteTemplate(templateName);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Email template not found'
      });
    }

    res.json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete email template'
    });
  }
});

// Preview email template with sample data (admin only) - with additional security middleware
router.post('/:templateName/preview', auth, authorize(['admin']), emailTemplateAuth, validateTemplateAccess, async (req, res) => {
  try {
    const { templateName } = req.params;
    const { variables = {} } = req.body;
    
    const { renderEmailTemplate } = require('../services/emailTemplateService');
    const rendered = await renderEmailTemplate(templateName, variables);
    
    res.json({
      success: true,
      data: rendered
    });
  } catch (error) {
    console.error('Error previewing email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to preview email template'
    });
  }
});

module.exports = router;
