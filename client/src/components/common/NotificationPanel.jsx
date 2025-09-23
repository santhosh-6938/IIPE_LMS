import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAsRead, refreshNotifications } from '../../store/slices/notificationSlice';
import { Bell, CheckCircle, AlertCircle, BookOpen, FileText, RefreshCw, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationPanel = () => {
  const dispatch = useDispatch();
  const { notifications, isLoading, error } = useSelector(state => state.notification);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAsRead = (notificationId) => {
    dispatch(markAsRead(notificationId));
  };

  const handleRefresh = () => {
    dispatch(refreshNotifications());
    dispatch(fetchNotifications());
  };

  const getIcon = (type) => {
    switch (type) {
      case 'classroom':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'task':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'deadline':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'auto_submission':
        return <Clock className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh notifications"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center text-blue-600">
              <Bell className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">{notifications.filter(n => !n.read).length} new</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {error ? 'Failed to load notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  !notification.read ? 'bg-blue-50' : ''
                } ${notification.type === 'auto_submission' ? 'border-l-4 border-red-400' : ''}`}
                onClick={() => !notification.read && handleMarkAsRead(notification._id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    {notification.type === 'auto_submission' && (
                      <p className="text-xs text-red-600 font-medium mt-1">
                        ⚠️ Auto-submitted due to deadline
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'auto_submission' ? 'bg-red-600' : 'bg-blue-600'
                    }`}></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;