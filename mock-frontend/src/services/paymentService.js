import axiosClient from '../api/axiosClient'

// ===== WALLET OPERATIONS =====
export function createWallet() {
  return axiosClient.post('/api/v1/wallet')
}

export function getWalletBalance() {
  return axiosClient.get('/api/v1/wallet/balance')
}

export function getWalletHistory() {
  return axiosClient.get('/api/v1/wallet/history')
}

export function createWithdrawalRequest(payload) {
  return axiosClient.post('/api/v1/wallet/withdrawals', payload)
}

export function getWithdrawalRequests() {
  return axiosClient.get('/api/v1/wallet/withdrawals')
}

// ===== SUBSCRIPTION OPERATIONS =====
export function getSubscriptionPlans() {
  return axiosClient.get('/api/v1/subscriptions/plans')
}

export function subscribeToPlan(subscriptionPlanId, paymentMethod = 'VNPAY') {
  return axiosClient.post('/api/v1/subscriptions/subscribe', {
    subscriptionPlanId,
    paymentMethod,
  })
}

export const subscribeToplan = subscribeToPlan

export function getWorkerSubscriptionInfo() {
  return axiosClient.get('/api/v1/subscriptions/info')
}
