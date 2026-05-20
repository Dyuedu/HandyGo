import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptBooking,
  confirmCompletion,
  createBooking,
  declineBooking,
  getBookingById,
  getBookings,
  markCompleted,
  startProcessing,
} from '../../../services/bookingService'

const bookingsKeyRoot = 'bookings'

function bookingDetailKey(bookingId) {
  return ['booking', bookingId]
}

/**
 * List bookings for the current user (role determines customer vs technician lists).
 * @param {object} [params] - forwarded to {@link getBookings} (e.g. `status` string or string[])
 */
export function useBookings(params) {
  return useQuery({
    queryKey: [bookingsKeyRoot, params ?? {}],
    queryFn: () => getBookings(params ?? {}),
  })
}

/**
 * @param {string|undefined|null} bookingId - UUID
 */
export function useBookingDetail(bookingId) {
  return useQuery({
    queryKey: bookingDetailKey(bookingId),
    queryFn: () => getBookingById(bookingId),
    enabled: Boolean(bookingId),
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createBooking(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [bookingsKeyRoot] })
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: bookingDetailKey(data.id) })
      }
    },
  })
}

export function useAcceptBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookingId) => acceptBooking(bookingId),
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: [bookingsKeyRoot] })
      queryClient.invalidateQueries({ queryKey: bookingDetailKey(bookingId) })
    },
  })
}

export function useMarkCompleted() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookingId) => markCompleted(bookingId),
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: [bookingsKeyRoot] })
      queryClient.invalidateQueries({ queryKey: bookingDetailKey(bookingId) })
    },
  })
}

export function useConfirmCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookingId) => confirmCompletion(bookingId),
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: [bookingsKeyRoot] })
      queryClient.invalidateQueries({ queryKey: bookingDetailKey(bookingId) })
    },
  })
}

export function useDeclineBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookingId) => declineBooking(bookingId),
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: [bookingsKeyRoot] })
      queryClient.invalidateQueries({ queryKey: bookingDetailKey(bookingId) })
    },
  })
}

export function useStartProcessing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookingId) => startProcessing(bookingId),
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: [bookingsKeyRoot] })
      queryClient.invalidateQueries({ queryKey: bookingDetailKey(bookingId) })
    },
  })
}
