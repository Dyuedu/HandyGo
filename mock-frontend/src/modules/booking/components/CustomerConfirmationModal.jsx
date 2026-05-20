import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { confirmCompletion } from '../../../services/bookingService'
import '../pages/BookingPages.css'

const bookingsKeyRoot = 'bookings'

function bookingDetailKey(id) {
  return ['booking', id]
}

/**
 * Confirms customer acceptance after technician marks work complete.
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.bookingId
 * @param {() => void} props.onClose
 */
export function CustomerConfirmationModal({ open, bookingId, onClose }) {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(false)

  if (!open) return null

  async function handleConfirm() {
    if (!bookingId) return
    setPending(true)
    try {
      await confirmCompletion(bookingId)
      queryClient.invalidateQueries({ queryKey: [bookingsKeyRoot] })
      queryClient.invalidateQueries({ queryKey: bookingDetailKey(bookingId) })
      onClose()
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="booking-modal-overlay"
      role="presentation"
      onClick={() => !pending && onClose()}
    >
      <div
        className="booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="customer-confirm-message" style={{ margin: 0 }}>
          Technician reported work completion. Confirm completed?
        </p>
        <div className="booking-modal-actions booking-modal-actions--confirm">
          <button
            type="button"
            className="confirm"
            disabled={pending}
            onClick={handleConfirm}
          >
            Confirm Completion
          </button>
        </div>
      </div>
    </div>
  )
}
