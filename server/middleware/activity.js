const ActivityLog = require('../models/ActivityLog');

async function logActivity(req, action, resourceType = '', resourceId = '', metadata = {}) {
  try {
    if (!req.user) return;
    await ActivityLog.create({
      user: req.user._id,
      role: req.user.role,
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : '',
      metadata,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || ''
    });
  } catch (e) {
    console.warn('Activity log failed:', e.message);
  }
}

module.exports = { logActivity };
