import axiosClient from '../api/axiosClient'

export function getWalletBalance() {
  return axiosClient.get('/api/wallet/balance')
}
