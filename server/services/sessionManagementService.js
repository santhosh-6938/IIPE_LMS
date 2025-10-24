const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserSession = require('../models/UserSession');
const User = require('../models/User');
const { sendEmail } = require('./emailService');
const { renderEmailTemplate } = require('./emailTemplateService');

// Generate unique session ID
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create user session
const createUserSession = async (userId, token, ipAddress, userAgent) => {
  try {
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = new UserSession({
      userId,
      sessionId,
      token,
      ipAddress,
      userAgent,
      expiresAt
    });

    await session.save();
    return session;
  } catch (error) {
    console.error('Create user session error:', error);
    throw error;
  }
};

// Get active user sessions
const getActiveUserSessions = async (userId) => {
  try {
    return await UserSession.find({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ lastActivity: -1 });
  } catch (error) {
    console.error('Get active user sessions error:', error);
    return [];
  }
};

// Check for concurrent login
const checkConcurrentLogin = async (userId, ipAddress, userAgent) => {
  try {
    // First check if this IP is blocked
    const blockedSession = await UserSession.findOne({
      userId,
      ipAddress,
      blockedUntil: { $gt: new Date() }
    });

    if (blockedSession) {
      const timeRemaining = Math.ceil((blockedSession.blockedUntil - new Date()) / 1000 / 60); // minutes
      return {
        hasConcurrentLogin: true,
        message: `This device is blocked for ${timeRemaining} more minutes due to previous denied login attempts.`,
        code: 'IP_BLOCKED',
        blockedUntil: blockedSession.blockedUntil,
        attemptNumber: blockedSession.loginAttempts
      };
    }

    const activeSessions = await getActiveUserSessions(userId);
    
    if (activeSessions.length === 0) {
      return { hasConcurrentLogin: false };
    }

    // Check if the same IP and user agent (likely same device)
    const sameDeviceSession = activeSessions.find(session => 
      session.ipAddress === ipAddress && session.userAgent === userAgent
    );

    if (sameDeviceSession) {
      // Same device, update last activity
      sameDeviceSession.lastActivity = new Date();
      await sameDeviceSession.save();
      return { hasConcurrentLogin: false, session: sameDeviceSession };
    }

    // Different device, check for concurrent login requests
    const pendingRequests = activeSessions.filter(session => 
      session.concurrentLoginRequests.some(req => 
        req.status === 'pending' && req.expiresAt > new Date()
      )
    );

    if (pendingRequests.length > 0) {
      return {
        hasConcurrentLogin: true,
        message: 'A concurrent login request is already pending. Please wait.',
        code: 'PENDING_REQUEST_EXISTS'
      };
    }

    // Create concurrent login request
    const primarySession = activeSessions[0]; // Most recent session
    const newRequest = {
      sessionId: generateSessionId(),
      ipAddress,
      userAgent,
      requestedAt: new Date(),
      status: 'pending',
      expiresAt: new Date(Date.now() + 2 * 60 * 1000) // 2 minutes
    };

    primarySession.concurrentLoginRequests.push(newRequest);
    await primarySession.save();

    return {
      hasConcurrentLogin: true,
      message: 'Concurrent login detected. Please wait for approval.',
      code: 'CONCURRENT_LOGIN_DETECTED',
      requestId: newRequest.sessionId,
      primarySessionId: primarySession.sessionId
    };

  } catch (error) {
    console.error('Check concurrent login error:', error);
    return { hasConcurrentLogin: false };
  }
};

// Send concurrent login notification using database template
const sendConcurrentLoginNotification = async (userId, requestDetails) => {
  try {
    const user = await User.findById(userId).select('name email');
    if (!user) return;

    const template = await renderEmailTemplate('concurrent_login_alert', {
      userName: user.name,
      ipAddress: requestDetails.ipAddress,
      userAgent: requestDetails.userAgent,
      timestamp: new Date().toLocaleString()
    });

    return await sendEmail(user.email, template.subject, template.bodyHtml, template.bodyText);
  } catch (error) {
    console.error('Send concurrent login notification error:', error);
  }
};

// Handle concurrent login response
const handleConcurrentLoginResponse = async (userId, requestId, response) => {
  try {
    const sessions = await UserSession.find({
      userId,
      isActive: true,
      'concurrentLoginRequests.sessionId': requestId
    });

    if (sessions.length === 0) {
      return {
        success: false,
        message: 'Concurrent login request not found or expired',
        code: 'REQUEST_NOT_FOUND'
      };
    }

    const session = sessions[0];
    const request = session.concurrentLoginRequests.find(req => req.sessionId === requestId);

    if (!request || request.expiresAt < new Date()) {
      return {
        success: false,
        message: 'Concurrent login request has expired',
        code: 'REQUEST_EXPIRED'
      };
    }

    if (response === 'approve') {
      // Deactivate all other sessions
      await UserSession.updateMany(
        { userId, isActive: true },
        { isActive: false }
      );

      // Create new session for the approved login
      const newToken = jwt.sign(
        { userId, sessionId: requestId },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const newSession = await createUserSession(
        userId,
        newToken,
        request.ipAddress,
        request.userAgent
      );

      // Clean up the request
      session.concurrentLoginRequests = session.concurrentLoginRequests.filter(
        req => req.sessionId !== requestId
      );
      await session.save();

      return {
        success: true,
        message: 'Login approved. Previous sessions have been terminated.',
        token: newToken,
        session: newSession
      };

    } else if (response === 'deny') {
      // Implement progressive blocking system
      const ipAddress = request.ipAddress;
      
      // Find or create a session record for this IP to track blocking attempts
      let ipSession = await UserSession.findOne({
        userId,
        ipAddress,
        isActive: true
      });

      if (!ipSession) {
        // Create a temporary session record to track blocking
        ipSession = new UserSession({
          userId,
          sessionId: generateSessionId(),
          token: 'blocked',
          ipAddress,
          userAgent: request.userAgent,
          isActive: false, // Mark as inactive since it's just for tracking
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
      }

      // Increment login attempts and calculate progressive blocking duration
      ipSession.loginAttempts = (ipSession.loginAttempts || 0) + 1;
      
      // Progressive blocking durations: 2min, 5min, 10min, 60min, then 60min
      const blockDurations = [2, 5, 10, 60]; // in minutes
      const attemptIndex = Math.min(ipSession.loginAttempts - 1, blockDurations.length - 1);
      const blockDurationMinutes = blockDurations[attemptIndex];
      const blockDurationMs = blockDurationMinutes * 60 * 1000;
      
      ipSession.blockedUntil = new Date(Date.now() + blockDurationMs);
      await ipSession.save();

      // Clean up the request
      session.concurrentLoginRequests = session.concurrentLoginRequests.filter(
        req => req.sessionId !== requestId
      );
      await session.save();

      return {
        success: true,
        message: `Login denied. The requesting device has been blocked for ${blockDurationMinutes} minutes.`,
        blockedUntil: ipSession.blockedUntil,
        attemptNumber: ipSession.loginAttempts,
        nextBlockDuration: blockDurations[Math.min(attemptIndex + 1, blockDurations.length - 1)]
      };
    }

    return {
      success: false,
      message: 'Invalid response',
      code: 'INVALID_RESPONSE'
    };

  } catch (error) {
    console.error('Handle concurrent login response error:', error);
    return {
      success: false,
      message: 'Failed to process response',
      code: 'INTERNAL_ERROR'
    };
  }
};

// Deactivate user session
const deactivateUserSession = async (sessionId) => {
  try {
    await UserSession.updateOne(
      { sessionId },
      { isActive: false }
    );
  } catch (error) {
    console.error('Deactivate user session error:', error);
  }
};

// Clean up expired sessions
const cleanupExpiredSessions = async () => {
  try {
    const result = await UserSession.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`Cleaned up ${result.deletedCount} expired sessions`);
  } catch (error) {
    console.error('Cleanup expired sessions error:', error);
  }
};

// Get concurrent login requests for user
const getConcurrentLoginRequests = async (userId) => {
  try {
    const sessions = await UserSession.find({
      userId,
      isActive: true,
      'concurrentLoginRequests.status': 'pending'
    });

    const requests = [];
    sessions.forEach(session => {
      session.concurrentLoginRequests.forEach(request => {
        if (request.status === 'pending' && request.expiresAt > new Date()) {
          requests.push({
            requestId: request.sessionId,
            ipAddress: request.ipAddress,
            userAgent: request.userAgent,
            requestedAt: request.requestedAt,
            expiresAt: request.expiresAt
          });
        }
      });
    });

    return requests;
  } catch (error) {
    console.error('Get concurrent login requests error:', error);
    return [];
  }
};

module.exports = {
  createUserSession,
  getActiveUserSessions,
  checkConcurrentLogin,
  sendConcurrentLoginNotification,
  handleConcurrentLoginResponse,
  deactivateUserSession,
  cleanupExpiredSessions,
  getConcurrentLoginRequests
};
