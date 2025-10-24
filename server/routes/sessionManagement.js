const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getConcurrentLoginRequests,
  handleConcurrentLoginResponse,
  getActiveUserSessions,
  deactivateUserSession
} = require('../services/sessionManagementService');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get concurrent login requests for current user
router.get('/concurrent-login-requests', async (req, res) => {
  try {
    const requests = await getConcurrentLoginRequests(req.user._id);
    
    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Get concurrent login requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Handle concurrent login response (approve/deny)
router.post('/concurrent-login-response', async (req, res) => {
  try {
    const { requestId, response } = req.body;

    if (!requestId || !response) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and response are required'
      });
    }

    if (!['approve', 'deny'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Response must be approve or deny'
      });
    }

    const result = await handleConcurrentLoginResponse(
      req.user._id,
      requestId,
      response
    );

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        token: result.token,
        blockedUntil: result.blockedUntil
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Handle concurrent login response error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get active sessions for current user
router.get('/active-sessions', async (req, res) => {
  try {
    const sessions = await getActiveUserSessions(req.user._id);
    
    const sessionData = sessions.map(session => ({
      sessionId: session.sessionId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt
    }));

    res.json({
      success: true,
      sessions: sessionData
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Deactivate a specific session
router.post('/deactivate-session', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    await deactivateUserSession(sessionId);
    
    res.json({
      success: true,
      message: 'Session deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
