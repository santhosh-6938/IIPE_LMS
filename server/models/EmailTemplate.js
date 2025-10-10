const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  templateName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  bodyHtml: {
    type: String,
    required: true
  },
  bodyText: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  variables: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient template lookups
emailTemplateSchema.index({ templateName: 1, isActive: 1 });

// Static method to get template by name (admin access only)
emailTemplateSchema.statics.getTemplate = async function(templateName) {
  try {
    const template = await this.findOne({ 
      templateName, 
      isActive: true 
    }).select('templateName subject bodyHtml bodyText description variables');
    
    if (!template) {
      console.warn(`Email template '${templateName}' not found in database`);
      return null;
    }
    
    return template;
  } catch (error) {
    console.error('Error fetching email template:', error);
    return null;
  }
};

// Static method to get template for admin management (includes all fields)
emailTemplateSchema.statics.getTemplateForAdmin = async function(templateName) {
  try {
    const template = await this.findOne({ 
      templateName, 
      isActive: true 
    });
    return template;
  } catch (error) {
    console.error('Error fetching email template for admin:', error);
    return null;
  }
};

// Method to render template with variables
emailTemplateSchema.methods.render = function(variables = {}) {
  let subject = this.subject;
  let bodyHtml = this.bodyHtml;
  let bodyText = this.bodyText;

  // Replace placeholders in subject
  Object.keys(variables).forEach(key => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(placeholder, variables[key] || '');
    bodyHtml = bodyHtml.replace(placeholder, variables[key] || '');
    bodyText = bodyText.replace(placeholder, variables[key] || '');
  });

  return {
    subject,
    bodyHtml,
    bodyText
  };
};

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
