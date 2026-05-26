import { getBrowserLocale, formatMoney } from '../i18n/formatters'

function text(value, fallback = '') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function number(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function localizeNotification(notification, t, language) {
  const data = notification?.data || {}
  const fallback = {
    title: notification?.title || t('notification.fallbackTitle'),
    message: notification?.message || '',
  }

  const serviceName = text(data.serviceName, t('notification.serviceFallback'))
  const customerName = text(data.customerName, t('common.customer'))
  const workerName = text(data.workerName || data.customerName, t('common.worker'))
  const senderName = text(data.senderName, t('chat.newUser'))
  const reviewerName = text(data.reviewerName, t('chat.newUser'))
  const rating = text(data.rating, '')
  const planName = text(data.planName, t('subscription.unknown'))
  const daysRemaining = text(data.daysRemaining, '0')
  const reason = text(data.reason, notification?.message || '')
  const amount = formatMoney(number(data.amount), language)

  switch (notification?.type) {
    case 'BOOKING_CREATED':
      return {
        title: t('notification.BOOKING_CREATED.title'),
        message: t('notification.BOOKING_CREATED.message', { customerName, serviceName }),
      }
    case 'BOOKING_CANCELLED':
      return {
        title: t('notification.BOOKING_CANCELLED.title'),
        message: t('notification.BOOKING_CANCELLED.message', { customerName, serviceName }),
      }
    case 'BOOKING_ACCEPTED':
      return {
        title: t('notification.BOOKING_ACCEPTED.title'),
        message: t('notification.BOOKING_ACCEPTED.message', { workerName }),
      }
    case 'BOOKING_REJECTED':
      return {
        title: t('notification.BOOKING_REJECTED.title'),
        message: t('notification.BOOKING_REJECTED.message'),
      }
    case 'BOOKING_PROCESSING':
      return {
        title: t('notification.BOOKING_PROCESSING.title'),
        message: t('notification.BOOKING_PROCESSING.message', { workerName, serviceName }),
      }
    case 'BOOKING_COMPLETED':
      return {
        title: t('notification.BOOKING_COMPLETED.title'),
        message: t('notification.BOOKING_COMPLETED.message', { workerName, serviceName }),
      }
    case 'BOOKING_CONFIRMED':
      return {
        title: t('notification.BOOKING_CONFIRMED.title'),
        message: t('notification.BOOKING_CONFIRMED.message', { customerName, serviceName }),
      }
    case 'MESSAGE_NEW':
      return {
        title: t('notification.MESSAGE_NEW.title', { senderName }),
        message: notification?.message || t('chat.message'),
      }
    case 'WALLET_TOPUP_SUCCESS':
      return {
        title: t('notification.WALLET_TOPUP_SUCCESS.title'),
        message: t('notification.WALLET_TOPUP_SUCCESS.message', { amount }),
      }
    case 'WALLET_TOPUP_FAILED':
      return {
        title: t('notification.WALLET_TOPUP_FAILED.title'),
        message: t('notification.WALLET_TOPUP_FAILED.message', { amount }),
      }
    case 'SUBSCRIPTION_UPGRADE':
      return {
        title: t('notification.SUBSCRIPTION_UPGRADE.title'),
        message: t('notification.SUBSCRIPTION_UPGRADE.message', { planName }),
      }
    case 'SUBSCRIPTION_EXPIRING':
      return {
        title: t('notification.SUBSCRIPTION_EXPIRING.title'),
        message: t('notification.SUBSCRIPTION_EXPIRING.message', { planName, daysRemaining }),
      }
    case 'PROFILE_APPROVED':
      return {
        title: t('notification.PROFILE_APPROVED.title'),
        message: t('notification.PROFILE_APPROVED.message'),
      }
    case 'PROFILE_REJECTED':
      return {
        title: t('notification.PROFILE_REJECTED.title'),
        message: t('notification.PROFILE_REJECTED.message', { reason }),
      }
    case 'REVIEW_CREATED':
      return {
        title: t('notification.REVIEW_CREATED.title', { reviewerName, rating }),
        message: notification?.message || t('notification.REVIEW_CREATED.message'),
      }
    default:
      return fallback
  }
}

export function formatNotificationTime(createdAt, language, t) {
  if (!createdAt) return t('notification.time.now')

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return t('notification.time.now')

  const diffMs = date.getTime() - Date.now()
  const absMs = Math.abs(diffMs)
  const rtf = new Intl.RelativeTimeFormat(getBrowserLocale(language), { numeric: 'auto' })

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (absMs < minute) return t('notification.time.justNow')
  if (absMs < hour) return rtf.format(Math.round(diffMs / minute), 'minute')
  if (absMs < day) return rtf.format(Math.round(diffMs / hour), 'hour')
  if (absMs < 7 * day) return rtf.format(Math.round(diffMs / day), 'day')

  return new Intl.DateTimeFormat(getBrowserLocale(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
