const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization');
    
    if (!token || !token.startsWith('Bearer ')) {
      console.log('Auth failed: No token or invalid format', { 
        hasToken: !!token, 
        startsWithBearer: token ? token.startsWith('Bearer ') : false,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const tokenValue = token.substring(7); // Remove 'Bearer ' prefix
    
    if (!tokenValue) {
      console.log('Auth failed: Empty token value');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET || 'your-secret-key');
    
    if (!decoded.userId) {
      console.log('Auth failed: No userId in token');
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.log('Auth failed: User not found', { userId: decoded.userId });
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Check if user account is blocked
    if (user.isBlocked) {
      console.log('Auth failed: User account is blocked', { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        blockedAt: user.blockedAt,
        blockedBy: user.blockedBy,
        blockedReason: user.blockedReason
      });
      return res.status(403).json({ 
        message: 'Your account has been blocked. Please contact admin.',
        code: 'ACCOUNT_BLOCKED'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      console.log('Auth failed: User account is inactive', { 
        userId: user._id, 
        email: user.email, 
        role: user.role
      });
      return res.status(403).json({ 
        message: 'Your account is inactive. Please contact admin.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token is not valid' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based authorization middleware (accepts string, array, or varargs)
const authorize = (...rolesInput) => {
  // Normalize roles: support authorize('admin'), authorize('admin','teacher'), authorize(['admin']), authorize(['admin','teacher'])
  const normalizedRoles = Array.isArray(rolesInput[0]) ? rolesInput[0] : rolesInput;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied' });
    }

    if (!normalizedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: insufficient permissions' });
    }

    next();
  };
};

module.exports = { auth, authorize };