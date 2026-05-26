import notificationService from '../services/notificationService';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNotificationTime, localizeNotification } from '../utils/notificationLocale';
import './NotificationItem.css';

const NotificationItem = ({ notification, onClick, onDelete }) => {
  const { language, t } = useLanguage();
  const localized = localizeNotification(notification, t, language);
  const icon = notificationService.getNotificationIcon(notification.type);

  return (
    <div className={`notification-item ${notification.isRead ? 'read' : 'unread'}`} onClick={onClick}>
      <div className="notification-item-icon">
        <span className="icon-emoji">{icon}</span>
      </div>

      <div className="notification-item-content">
        <h4 className="notification-item-title">{localized.title}</h4>
        <p className="notification-item-message">{localized.message}</p>
        <span className="notification-item-time">
          {formatNotificationTime(notification.createdAt, language, t)}
        </span>
      </div>

      <button
        className="notification-item-delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title={t('notification.delete')}
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
