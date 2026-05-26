import axiosClient from '../api/axiosClient'

const REVIEWS_BASE = '/api/v1/bookings'
const WORKER_REVIEWS_BASE = '/api/v1/workers'

export function createReview(bookingId, payload) {
  return axiosClient.post(`${REVIEWS_BASE}/${bookingId}/reviews`, payload)
}

export function getReviewByBookingId(bookingId) {
  return axiosClient.get(`${REVIEWS_BASE}/${bookingId}/reviews`)
}

export function getReviewsByWorkerId(workerId) {
  return axiosClient.get(`${WORKER_REVIEWS_BASE}/${workerId}/reviews`)
}

export function createWorkerReview(workerId, payload) {
  return axiosClient.post(`${WORKER_REVIEWS_BASE}/${workerId}/reviews`, payload)
}

export function getMyWorkerReviewStatus(workerId) {
  return axiosClient.get(`${WORKER_REVIEWS_BASE}/${workerId}/reviews/me`)
}
