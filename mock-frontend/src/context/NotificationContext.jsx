import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import notificationService from '@/services/notificationService';

export const NotificationContext = createContext();

// Action types
export const NOTIFICATION_ACTIONS = {
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  UPDATE_UNREAD_COUNT: 'UPDATE_UNREAD_COUNT',
  MARK_AS_READ: 'MARK_AS_READ',
  CLEAR_ALL: 'CLEAR_ALL',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  UPDATE_PAGINATION: 'UPDATE_PAGINATION'
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pagination: {
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  }
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload.content || [],
        unreadCount: action.payload.unreadCount || 0,
        pagination: {
          pageNumber: action.payload.pageNumber,
          pageSize: action.payload.pageSize,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
          hasNext: action.payload.hasNext,
          hasPrevious: action.payload.hasPrevious
        },
        isLoading: false
      };

    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };

    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        totalElements: Math.max(0, state.pagination.totalElements - 1)
      };

    case NOTIFICATION_ACTIONS.UPDATE_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload
      };

    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case NOTIFICATION_ACTIONS.CLEAR_ALL:
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };

    case NOTIFICATION_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case NOTIFICATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case NOTIFICATION_ACTIONS.UPDATE_PAGINATION:
      return {
        ...state,
        pagination: action.payload
      };

    default:
      return state;
  }
};

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  let wsConnection = null;

  // Fetch initial notifications
  const fetchNotifications = useCallback(async (page = 0, limit = 10, type = null) => {
    dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await notificationService.getNotifications(page, limit, type);
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
        payload: response.data
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_ERROR,
        payload: error.message
      });
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      dispatch({
        type: NOTIFICATION_ACTIONS.UPDATE_UNREAD_COUNT,
        payload: response.data
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      dispatch({
        type: NOTIFICATION_ACTIONS.MARK_AS_READ,
        payload: notificationId
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      const updatedNotifications = state.notifications.map(n => ({
        ...n,
        isRead: true
      }));
      dispatch({
        type: NOTIFICATION_ACTIONS.CLEAR_ALL
      });
      // Re-fetch to update
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [state.notifications, fetchNotifications]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      dispatch({
        type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION,
        payload: notificationId
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Subscribe to WebSocket
  useEffect(() => {
    // Initial load
    fetchUnreadCount();
    fetchNotifications();

    // Subscribe to WebSocket
    wsConnection = notificationService.subscribeToNotifications(
      (notification) => {
        console.log('New notification received:', notification);
        dispatch({
          type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
          payload: notification
        });
      },
      (error) => {
        console.error('WebSocket error:', error);
        dispatch({
          type: NOTIFICATION_ACTIONS.SET_ERROR,
          payload: 'Real-time notifications unavailable'
        });
      }
    );

    // Cleanup
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [fetchNotifications, fetchUnreadCount]);

  const value = {
    ...state,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    dispatch
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use NotificationContext
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
