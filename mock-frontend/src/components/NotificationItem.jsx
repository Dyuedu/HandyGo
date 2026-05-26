import React from 'react';
import notificationService from '../services/notificationService';
import './NotificationItem.css';

const NotificationItem = ({ notification, onClick, onDelete }) => {
  const getRelativeTime = (createdAt) => {
    if (!createdAt) return 'now';
    
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const icon = notificationService.getNotificationIcon(notification.type);

  return (
    <div className={`notification-item ${notification.isRead ? 'read' : 'unread'}`} onClick={onClick}>
      <div className="notification-item-icon">
        <span className="icon-emoji">{icon}</span>
      </div>

      <div className="notification-item-content">
        <h4 className="notification-item-title">{notification.title}</h4>
        <p className="notification-item-message">{notification.message}</p>
        <span className="notification-item-time">
          {getRelativeTime(notification.createdAt)}
        </span>
      </div>

      <button
        className="notification-item-delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete notification"
      >
        ✕
      </button>

      {!notification.isRead && (
        <div className="notification-item-unread-indicator"></div>
      )}
    </div>
  );
};

export default NotificationItem;
