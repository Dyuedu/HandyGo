import axiosClient from '../api/axiosClient'

const BOOKINGS_BASE = '/api/v1/bookings'

/**
 * @param {object} payload
 * @param {string} payload.workerId - UUID
 * @param {string} payload.address
 * @param {string} [payload.bookingDate] - ISO local date-time
 * @param {string} [payload.description]
 * @param {string} [payload.serviceCode]
 * @param {number} [payload.voucherId]
 * @param {number} [payload.totalAmount] - set later by technician on complete
 */
export function createBooking(payload) {
  return axiosClient.post(BOOKINGS_BASE, payload)
}

/**
 * @param {object} [params]
 * @param {string|string[]} [params.status] - repeated `status` query params for Spring (`?status=A&status=B`)
 */
export function getBookings(params = {}) {
  const { status, ...rest } = params
  if (Array.isArray(status) && status.length > 0) {
    const search = new URLSearchParams()
    Object.entries(rest).forEach(([key, value]) => {
      if (value != null && value !== '') search.append(key, String(value))
    })
    status.forEach((s) => search.append('status', s))
    return axiosClient.get(BOOKINGS_BASE, { params: search })
  }
  return axiosClient.get(BOOKINGS_BASE, {
    params: {
      ...rest,
      ...(status != null && status !== '' ? { status } : {}),
    },
  })
}

/**
 * @param {string} bookingId - UUID
 */
export function getBookingById(bookingId) {
  return axiosClient.get(`${BOOKINGS_BASE}/${bookingId}`)
}

export function acceptBooking(bookingId) {
  return axiosClient.patch(`${BOOKINGS_BASE}/${bookingId}/accept`)
}

export function declineBooking(bookingId) {
  return axiosClient.patch(`${BOOKINGS_BASE}/${bookingId}/decline`)
}

export function cancelBooking(bookingId) {
  return axiosClient.patch(`${BOOKINGS_BASE}/${bookingId}/cancel`)
}

export function startProcessing(bookingId) {
  return axiosClient.patch(`${BOOKINGS_BASE}/${bookingId}/processing`)
}

/**
 * @param {string} bookingId
 * @param {{ totalAmount: number }} payload
 */
export function markCompleted(bookingId, payload) {
  return axiosClient.patch(`${BOOKINGS_BASE}/${bookingId}/complete`, payload)
}

export function confirmCompletion(bookingId) {
  return axiosClient.patch(`${BOOKINGS_BASE}/${bookingId}/confirm`)
}
