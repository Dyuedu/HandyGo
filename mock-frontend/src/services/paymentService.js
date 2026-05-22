import axiosClient from '../api/axiosClient'

// ===== WALLET OPERATIONS =====
export function createWallet() {
  return axiosClient.post('/api/v1/wallet')
}

export function getWalletBalance() {
  return axiosClient.get('/api/v1/wallet/balance')
}

export function topUpWallet(amount, orderInfo = 'Wallet deposit', bankCode = null) {
  const data = {
    amount,
    orderInfo,
  }
  if (bankCode) {
    data.bankCode = bankCode
  }
  return axiosClient.post('/api/v1/wallet/topup', data)
}

export function getWalletHistory() {
  return axiosClient.get('/api/v1/wallet/history')
}

// ===== SUBSCRIPTION OPERATIONS =====
export function getSubscriptionPlans() {
  return axiosClient.get('/api/v1/subscriptions/plans')
}

export function subscribeToplan(subscriptionPlanId) {
  return axiosClient.post('/api/v1/subscriptions/subscribe', {
    subscriptionPlanId,
  })
}

export function getWorkerSubscriptionInfo() {
  return axiosClient.get('/api/v1/subscriptions/info')
}
