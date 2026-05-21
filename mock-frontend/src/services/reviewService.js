import axiosClient from '../api/axiosClient'

const REVIEWS_BASE = '/api/v1/bookings'

export function createReview(bookingId, payload) {
  return axiosClient.post(`${REVIEWS_BASE}/${bookingId}/reviews`, payload)
}

export function getReviewByBookingId(bookingId) {
  return axiosClient.get(`${REVIEWS_BASE}/${bookingId}/reviews`)
}
