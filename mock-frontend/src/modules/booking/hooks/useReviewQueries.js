import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createReview, getReviewByBookingId } from '../../../services/reviewService'

function reviewKey(bookingId) {
  return ['review', bookingId]
}

export function useReview(bookingId) {
  return useQuery({
    queryKey: reviewKey(bookingId),
    queryFn: () => getReviewByBookingId(bookingId),
    enabled: Boolean(bookingId),
    retry: false,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, payload }) => createReview(bookingId, payload),
    onSuccess: (_data, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: reviewKey(bookingId) })
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] })
    },
  })
}
