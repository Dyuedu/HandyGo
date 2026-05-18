import axiosClient from '../api/axiosClient'

export function getBookings(params) {
  return axiosClient.get('/api/bookings', { params })
}
