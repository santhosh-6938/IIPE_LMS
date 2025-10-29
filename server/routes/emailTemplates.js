const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { createOrUpdateTemplate, getAllTemplates, deleteTemplate, renderEmailTemplate } = require('../services/emailTemplateService');

const router = express.Router();

// All routes require authentication and admin access
router.use(auth);
router.use(authorize('admin'));

// Get all email templates
router.get('/', async (req, res) => {
  try {
    const templates = await getAllTemplates();
    
    res.json({
      success: true,
      templates: templates.map(template => ({
        templateName: template.templateName,
        subject: template.subject,
        description: template.description,
        variables: template.variables,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        createdBy: template.createdBy,
        updatedBy: template.updatedBy
      }))
    });
  } catch (error) {
    console.error('Error getting email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email templates'
    });
  }
});

// Get specific email template
router.get('/:templateName', async (req, res) => {
  try {
    const { templateName } = req.params;
    
    const template = await getAllTemplates().then(templates => 
      templates.find(t => t.templateName === templateName)
    );
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      template: {
        templateName: template.templateName,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
        description: template.description,
        variables: template.variables,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        createdBy: template.createdBy,
        updatedBy: template.updatedBy
      }
    });
  } catch (error) {
    console.error('Error getting email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email template'
    });
  }
});

// Create or update email template
router.post('/', async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      updatedBy: req.user._id
    };
    
    const template = await createOrUpdateTemplate(templateData);
    
    res.json({
      success: true,
      message: 'Template saved successfully',
      template: {
        templateName: template.templateName,
        subject: template.subject,
        description: template.description,
        variables: template.variables,
        isActive: template.isActive,
        updatedAt: template.updatedAt,
        updatedBy: template.updatedBy
      }
    });
  } catch (error) {
    console.error('Error saving email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save email template'
    });
  }
});

// Update email template
router.put('/:templateName', async (req, res) => {
  try {
    const { templateName } = req.params;
    const templateData = {
      ...req.body,
      templateName,
      updatedBy: req.user._id
    };
    
    const template = await createOrUpdateTemplate(templateData);
    
    res.json({
      success: true,
      message: 'Template updated successfully',
      template: {
        templateName: template.templateName,
        subject: template.subject,
        description: template.description,
        variables: template.variables,
        isActive: template.isActive,
        updatedAt: template.updatedAt,
        updatedBy: template.updatedBy
      }
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email template'
    });
  }
});

// Delete email template (soft delete)
router.delete('/:templateName', async (req, res) => {
  try {
    const { templateName } = req.params;
    
    const template = await deleteTemplate(templateName);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete email template'
    });
  }
});

// Preview email template with sample data
router.post('/:templateName/preview', async (req, res) => {
  try {
    const { templateName } = req.params;
    const { variables = {} } = req.body;
    
    const template = await renderEmailTemplate(templateName, variables);
    
    res.json({
      success: true,
      preview: {
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText
      }
    });
  } catch (error) {
    console.error('Error previewing email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview email template'
    });
  }
});

module.exports = router;