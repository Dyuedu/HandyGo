import axiosClient from '../api/axiosClient';

const API_BASE_URL = '/api/v1/notifications';

const notificationService = {
  /**
   * Get notifications with pagination and filtering
   * @param {number} page - Page number (0-based)
   * @param {number} limit - Number of items per page
   * @param {string} type - Optional notification type filter
   * @returns {Promise}
   */
  getNotifications: (page = 0, limit = 10, type = null) => {
    let url = `${API_BASE_URL}?page=${page}&limit=${limit}`;
    if (type) {
      url += `&type=${type}`;
    }
    return axiosClient.get(url);
  },

  /**
   * Get unread notifications count
   * @returns {Promise}
   */
  getUnreadCount: () => {
    return axiosClient.get(`${API_BASE_URL}/unread-count`);
  },

  /**
   * Get unread notifications (paginated)
   * @param {number} page
   * @param {number} limit
   * @returns {Promise}
   */
  getUnreadNotifications: (page = 0, limit = 10) => {
    let url = `${API_BASE_URL}?page=${page}&limit=${limit}&isRead=false`;
    return axiosClient.get(url);
  },

  /**
   * Get notification by ID
   * @param {number} notificationId
   * @returns {Promise}
   */
  getNotificationById: (notificationId) => {
    return axiosClient.get(`${API_BASE_URL}/${notificationId}`);
  },

  /**
   * Mark notification as read
   * @param {number} notificationId
   * @returns {Promise}
   */
  markAsRead: (notificationId) => {
    return axiosClient.put(`${API_BASE_URL}/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   * @returns {Promise}
   */
  markAllAsRead: () => {
    return axiosClient.put(`${API_BASE_URL}/read-all`);
  },

  /**
   * Delete notification
   * @param {number} notificationId
   * @returns {Promise}
   */
  deleteNotification: (notificationId) => {
    return axiosClient.delete(`${API_BASE_URL}/${notificationId}`);
  },

  /**
   * Delete old notifications (admin only)
   * @param {number} days - Delete notifications older than this many days
   * @returns {Promise}
   */
  deleteOldNotifications: (days = 90) => {
    return axiosClient.delete(`${API_BASE_URL}/cleanup?days=${days}`);
  },

  /**
   * Generate test notifications
   * @returns {Promise}
   */
  generateTestNotifications: () => {
    return axiosClient.post(`${API_BASE_URL}/test-generate`);
  },

  /**
   * Subscribe to WebSocket notifications
   * @param {function} onMessageCallback - Callback when notification arrives
   * @param {function} onErrorCallback - Callback on error
   * @returns {object} WebSocket connection object with close method
   */
  subscribeToNotifications: (onMessageCallback, onErrorCallback) => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws');
    const wsUrl = `${wsBaseUrl}/ws/notifications`;

    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectInterval = 3000;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected');
          reconnectAttempts = 0;
          // Subscribe to user's personal notification queue
          const session = JSON.parse(localStorage.getItem('mock.auth.session'));
          const userId = session?.id || localStorage.getItem('my_user_id');
          if (userId) {
            ws.send(JSON.stringify({
              action: 'SUBSCRIBE',
              target: `/queue/notifications/${userId}`
            }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const notification = JSON.parse(event.data);
            if (onMessageCallback) {
              onMessageCallback(notification);
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (onErrorCallback) {
            onErrorCallback(error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          // Auto-reconnect with exponential backoff
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delayMs = reconnectInterval * Math.pow(2, reconnectAttempts - 1);
            console.log(`Attempting to reconnect in ${delayMs}ms...`);
            setTimeout(connect, delayMs);
          }
        };
      } catch (e) {
        console.error('WebSocket connection error:', e);
        if (onErrorCallback) {
          onErrorCallback(e);
        }
      }
    };

    // Initiate connection
    connect();

    // Return object with control methods
    return {
      close: () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      },
      send: (message) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      },
      isConnected: () => ws && ws.readyState === WebSocket.OPEN
    };
  },

  /**
   * Get notification types enum
   */
  notificationTypes: {
    BOOKING_CREATED: 'BOOKING_CREATED',
    BOOKING_CANCELLED: 'BOOKING_CANCELLED',
    BOOKING_ACCEPTED: 'BOOKING_ACCEPTED',
    BOOKING_REJECTED: 'BOOKING_REJECTED',
    BOOKING_COMPLETED: 'BOOKING_COMPLETED',
    REVIEW_CREATED: 'REVIEW_CREATED',
    MESSAGE_NEW: 'MESSAGE_NEW',
    WALLET_TOPUP_SUCCESS: 'WALLET_TOPUP_SUCCESS',
    WALLET_TOPUP_FAILED: 'WALLET_TOPUP_FAILED',
    SUBSCRIPTION_UPGRADE: 'SUBSCRIPTION_UPGRADE',
    SUBSCRIPTION_EXPIRING: 'SUBSCRIPTION_EXPIRING',
    PROFILE_APPROVED: 'PROFILE_APPROVED',
    PROFILE_REJECTED: 'PROFILE_REJECTED'
  },

  /**
   * Get notification type icon
   */
  getNotificationIcon: (type) => {
    const icons = {
      BOOKING_CREATED: '📋',
      BOOKING_CANCELLED: '❌',
      BOOKING_ACCEPTED: '✅',
      BOOKING_REJECTED: '🚫',
      BOOKING_COMPLETED: '🏁',
      REVIEW_CREATED: '⭐',
      MESSAGE_NEW: '💬',
      WALLET_TOPUP_SUCCESS: '✅',
      WALLET_TOPUP_FAILED: '❌',
      SUBSCRIPTION_UPGRADE: '⬆️',
      SUBSCRIPTION_EXPIRING: '⏰',
      PROFILE_APPROVED: '✅',
      PROFILE_REJECTED: '❌'
    };
    return icons[type] || '🔔';
  }
};

export default notificationService;
