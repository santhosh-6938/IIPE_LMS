const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { logActivity } = require('../middleware/activity');

const router = express.Router();

// Block user account (admin only)
router.post('/block/:userId', auth, authorize(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent blocking other admins
    if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Cannot block other admin accounts'
      });
    }

    // Prevent blocking self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot block your own account'
      });
    }

    // Check if user is already blocked
    if (user.isBlocked) {
      return res.status(400).json({
        success: false,
        error: 'User account is already blocked'
      });
    }

    // Block the user
    user.isBlocked = true;
    user.blockedAt = new Date();
    user.blockedBy = req.user._id;
    user.blockedReason = reason || 'Account blocked by admin';
    user.updatedBy = req.user._id;

    await user.save();

    // Log the activity
    try {
      await logActivity(req, 'user.block', 'user', user._id, {
        blockedBy: req.user._id,
        reason: user.blockedReason,
        userRole: user.role,
        userEmail: user.email
      });
    } catch (logError) {
      console.error('Error logging block activity:', logError);
    }

    console.log(`User ${user.email} (${user.role}) blocked by admin ${req.user.email}`);

    res.json({
      success: true,
      message: 'User account blocked successfully',
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        blockedAt: user.blockedAt,
        blockedReason: user.blockedReason
      }
    });

  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to block user account'
    });
  }
});

// Unblock user account (admin only)
router.post('/unblock/:userId', auth, authorize(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is not blocked
    if (!user.isBlocked) {
      return res.status(400).json({
        success: false,
        error: 'User account is not blocked'
      });
    }

    // Unblock the user
    user.isBlocked = false;
    user.blockedAt = null;
    user.blockedBy = null;
    user.blockedReason = null;
    user.updatedBy = req.user._id;

    await user.save();

    // Log the activity
    try {
      await logActivity(req, 'user.unblock', 'user', user._id, {
        unblockedBy: req.user._id,
        userRole: user.role,
        userEmail: user.email
      });
    } catch (logError) {
      console.error('Error logging unblock activity:', logError);
    }

    console.log(`User ${user.email} (${user.role}) unblocked by admin ${req.user.email}`);

    res.json({
      success: true,
      message: 'User account unblocked successfully',
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked
      }
    });

  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unblock user account'
    });
  }
});

// Get blocked users list (admin only)
router.get('/blocked', auth, authorize(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { isBlocked: true };
    if (role) {
      query.role = role;
    }

    // Get blocked users with pagination
    const blockedUsers = await User.find(query)
      .select('name email role blockedAt blockedBy blockedReason createdAt')
      .populate('blockedBy', 'name email')
      .sort({ blockedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users: blockedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: skip + blockedUsers.length < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blocked users'
    });
  }
});

// Get user blocking status (admin only)
router.get('/status/:userId', auth, authorize(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('name email role isBlocked blockedAt blockedBy blockedReason isActive')
      .populate('blockedBy', 'name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isBlocked: user.isBlocked,
        blockedAt: user.blockedAt,
        blockedBy: user.blockedBy,
        blockedReason: user.blockedReason
      }
    });

  } catch (error) {
    console.error('Error fetching user blocking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user blocking status'
    });
  }
});

// Bulk block users (admin only)
router.post('/bulk-block', auth, authorize(['admin']), async (req, res) => {
  try {
    const { userIds, reason } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User IDs array is required'
      });
    }

    // Find users to block
    const users = await User.find({ 
      _id: { $in: userIds },
      isBlocked: false,
      role: { $ne: 'admin' } // Exclude admins
    });

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid users found to block'
      });
    }

    // Block users
    const blockPromises = users.map(user => {
      user.isBlocked = true;
      user.blockedAt = new Date();
      user.blockedBy = req.user._id;
      user.blockedReason = reason || 'Account blocked by admin';
      user.updatedBy = req.user._id;
      return user.save();
    });

    await Promise.all(blockPromises);

    // Log the activity
    try {
      await logActivity(req, 'user.bulk_block', 'user', null, {
        blockedBy: req.user._id,
        reason: reason || 'Account blocked by admin',
        blockedCount: users.length,
        blockedUsers: users.map(u => ({ id: u._id, email: u.email, role: u.role }))
      });
    } catch (logError) {
      console.error('Error logging bulk block activity:', logError);
    }

    console.log(`${users.length} users blocked by admin ${req.user.email}`);

    res.json({
      success: true,
      message: `${users.length} user accounts blocked successfully`,
      data: {
        blockedCount: users.length,
        blockedUsers: users.map(user => ({
          userId: user._id,
          email: user.email,
          role: user.role
        }))
      }
    });

  } catch (error) {
    console.error('Error bulk blocking users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to block users'
    });
  }
});

module.exports = router;
