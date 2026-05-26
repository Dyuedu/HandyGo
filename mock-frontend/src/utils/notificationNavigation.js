export function getNotificationTarget(notification) {
  const type = notification?.type || ''
  const data = notification?.data || {}

  if (type === 'MESSAGE_NEW') {
    const params = new URLSearchParams()
    if (data.chatId) params.set('contactId', String(data.chatId))
    if (data.senderName) params.set('name', String(data.senderName))
    const query = params.toString()
    return query ? `/app/chat?${query}` : '/app/chat'
  }

  if (type.startsWith('BOOKING_') || type === 'REVIEW_CREATED') {
    return '/app/activity'
  }

  if (type.startsWith('WALLET_')) {
    return '/app/wallet'
  }

  if (type.startsWith('SUBSCRIPTION_')) {
    return '/app/subscription'
  }

  if (type.startsWith('PROFILE_')) {
    return '/app/profile'
  }

  return '/app/notifications'
}
