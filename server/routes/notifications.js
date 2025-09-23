const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} = require('../controllers/notificationController');

const router = express.Router();

// Get user notifications
router.get('/', auth, getUserNotifications);

// Mark notification as read
// Support both PUT and PATCH for read, to match client usage
router.put('/:notificationId/read', auth, markAsRead);
router.patch('/:notificationId/read', auth, markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', auth, markAllAsRead);

// Delete notification
router.delete('/:notificationId', auth, deleteNotification);

// Get unread count
router.get('/unread-count', auth, getUnreadCount);

module.exports = router;