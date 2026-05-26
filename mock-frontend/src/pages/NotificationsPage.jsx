import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '../context/NotificationContext'
import NotificationItem from '../components/NotificationItem'
import { useLanguage } from '../i18n/LanguageContext'
import { getNotificationTarget } from '../utils/notificationNavigation'
import '../styles/pages/NotificationsPage.css'

export function NotificationsPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    isLoading,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotification()
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    fetchNotifications(0, 20)
  }, [fetchNotifications])

  const handleNotificationClick = async (notification) => {
    if (notification.id && !notification.isRead) {
      await markAsRead(notification.id)
    }
    navigate(getNotificationTarget(notification))
  }

  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    fetchNotifications(nextPage, pagination.pageSize || 20)
  }

  return (
    <section className="notifications-page">
      <div className="notifications-page-header">
        <div>
          <h1>{t('notification.title')}</h1>
          <p>{t('notification.pageDescription')}</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={markAllAsRead}>
            {t('notification.markAllRead')}
          </button>
        )}
      </div>

      {isLoading && notifications.length === 0 ? (
        <p className="notifications-muted">{t('notification.loading')}</p>
      ) : notifications.length === 0 ? (
        <p className="notifications-muted">{t('notification.empty')}</p>
      ) : (
        <div className="notifications-page-list">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
              onDelete={() => deleteNotification(notification.id)}
            />
          ))}
        </div>
      )}

      {pagination.hasNext && (
        <button
          type="button"
          className="notifications-load-more"
          onClick={handleLoadMore}
          disabled={isLoading}
        >
          {isLoading ? t('common.loading') : t('notification.loadMore')}
        </button>
      )}
    </section>
  )
}
