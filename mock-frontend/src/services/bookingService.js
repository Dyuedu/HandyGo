import axiosClient from '../api/axiosClient'

const BOOKINGS_BASE = '/api/v1/bookings'

/**
 * @param {object} payload
 * @param {string} payload.workerId - UUID
 * @param {string} [payload.serviceCode]
 * @param {string} payload.address
 * @param {number} [payload.voucherId]
 * @param {number|string} payload.totalAmount
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

export function startProcessing(bookingId) {
  return axiosClient.patch(`${BOOKINGS_BASE}/${bookingId}/processing`)
}

export function markCompleted(bookingId) {
  return axiosClient.patch(`${BOOKINGS_BASE}/${bookingId}/complete`)
}

export function confirmCompletion(bookingId) {
  return axiosClient.patch(`${BOOKINGS_BASE}/${bookingId}/confirm`)
}
