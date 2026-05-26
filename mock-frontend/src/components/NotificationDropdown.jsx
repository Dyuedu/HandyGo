import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../i18n/LanguageContext';
import { getNotificationTarget } from '../utils/notificationNavigation';
import NotificationItem from './NotificationItem';
import './NotificationDropdown.css';

const NotificationDropdown = ({ onClose }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    generateTestNotifications
  } = useNotification();

  const [currentPage, setCurrentPage] = useState(0);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchNotifications(nextPage, pagination.pageSize);
  };

  const handleNotificationClick = async (notification) => {
    if (notification.id && !notification.isRead) {
      await markAsRead(notification.id);
    }
    onClose?.();
    navigate(getNotificationTarget(notification));
  };

  const handleViewAll = () => {
    onClose?.();
    navigate('/app/notifications');
  };

  return (
    <div className="notification-dropdown">
      {/* Header */}
      <div className="notification-dropdown-header">
        <h3 className="notification-dropdown-title">
          {t('notification.title')}
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            className="mark-all-read-btn"
            onClick={markAllAsRead}
            title={t('notification.markAllRead')}
          >
            ✓
          </button>
        )}
      </div>

      {/* Content */}
      <div className="notification-dropdown-content">
        {isLoading && notifications.length === 0 ? (
          <div className="notification-loading">
            <div className="spinner"></div>
            <p>{t('notification.loading')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <span className="empty-icon">📭</span>
            <p>{t('notification.empty')}</p>
            <button className="generate-test-btn" onClick={generateTestNotifications} style={{ marginTop: '10px', padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {t('notification.generateTest')}
            </button>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.slice(0, 10).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onDelete={() => deleteNotification(notification.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="notification-dropdown-footer">
          {pagination.hasNext && (
            <button
              className="load-more-btn"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : t('notification.loadMore')}
            </button>
          )}
          <button
            className="view-all-btn"
            onClick={handleViewAll}
          >
            {t('notification.viewAll')} →
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
