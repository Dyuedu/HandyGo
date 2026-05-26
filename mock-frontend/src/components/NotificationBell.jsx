import { useState, useRef, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../i18n/LanguageContext';
import { localizeNotification } from '../utils/notificationLocale';
import NotificationDropdown from './NotificationDropdown';
import './NotificationBell.css';

const NotificationBell = () => {
  const { unreadCount, error, latestToast, fetchNotifications, fetchUnreadCount } = useNotification();
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);
  const localizedToast = latestToast ? localizeNotification(latestToast, t, language) : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Auto-refresh unread count every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  return (
    <div className="notification-bell-container" ref={bellRef}>
      <button
        className={`notification-bell-button ${error ? 'error' : ''}`}
        onClick={handleBellClick}
        title={t('notification.title')}
        aria-label={t('notification.title')}
      >
        <span className="bell-icon">🔔</span>
        
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}


      </button>

      {isOpen && (
        <div className="notification-dropdown-wrapper">
          <NotificationDropdown onClose={() => setIsOpen(false)} />
        </div>
      )}

      {error && (
        <div className="notification-error-toast">
          ⚠️ {error}
        </div>
      )}

      {/* Real-time Notification Toast */}
      {latestToast && localizedToast && (
        <div className="realtime-notification-toast">
          <div className="toast-icon">
            {latestToast.type === 'MESSAGE_NEW' ? '💬' : '🔔'}
          </div>
          <div className="toast-content">
            <div className="toast-title">{localizedToast.title}</div>
            <div className="toast-message">{localizedToast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
