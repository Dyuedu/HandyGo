import axiosClient from '../api/axiosClient'

const VOUCHERS_BASE = '/api/v1/vouchers'

/** List vouchers available for booking (optional selection). */
export function getAvailableVouchers() {
  return axiosClient.get(VOUCHERS_BASE)
}
