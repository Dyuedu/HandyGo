import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { confirmCompletion } from '../../../services/bookingService'
import '../../../styles/modules/booking/pages/BookingPages.css'

const bookingsKeyRoot = 'bookings'

function bookingDetailKey(id) {
  return ['booking', id]
}

function formatVnd(value) {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

/**
 * Customer confirms after paying cash to the technician.
 */
export function CustomerConfirmationModal({ open, bookingId, booking, onClose, onConfirmed }) {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  if (!open || !booking) return null

  const discount = Number(booking.discountAmount) || 0
  const finalAmount = Number(booking.finalAmount) ?? 0

  async function handleConfirm() {
    if (!bookingId) return
    setError('')
    setPending(true)
    try {
      await confirmCompletion(bookingId)
      queryClient.invalidateQueries({ queryKey: [bookingsKeyRoot] })
      queryClient.invalidateQueries({ queryKey: bookingDetailKey(bookingId) })
      if (onConfirmed) {
        onConfirmed()
      }
      onClose()
    } catch (err) {
      setError(err?.message || 'Không thể xác nhận hoàn thành.')
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
        className="booking-modal booking-modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="customer-confirm-title" style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>
          Xác nhận hoàn thành
        </h2>
        <p id="customer-confirm-message" className="booking-modal-hint">
          Thợ đã báo hoàn thành công việc. Vui lòng thanh toán tiền mặt cho thợ theo bảng phí bên dưới, sau đó xác nhận.
        </p>

        <div className="booking-payment-summary">
          <div className="booking-payment-row">
            <span>Phí dịch vụ</span>
            <strong>{formatVnd(booking.totalAmount)}</strong>
          </div>
          {discount > 0 && (
            <div className="booking-payment-row">
              <span>Giảm voucher</span>
              <strong>-{formatVnd(discount)}</strong>
            </div>
          )}
          <div className="booking-payment-row highlight">
            <span>Bạn trả tiền mặt cho thợ</span>
            <strong>{formatVnd(finalAmount)}</strong>
          </div>
        </div>

        <p className="booking-cash-note">
          Thanh toán trực tiếp cho thợ (tiền mặt). Không thanh toán qua ví/VNPay trong bước này.
        </p>

        {error && (
          <div className="booking-alert" role="alert" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        <div className="booking-modal-actions booking-modal-actions--confirm">
          <button type="button" disabled={pending} onClick={onClose}>
            Đóng
          </button>
          <button
            type="button"
            className="confirm"
            disabled={pending}
            onClick={handleConfirm}
          >
            {pending ? 'Đang xử lý…' : 'Xác nhận hoàn thành'}
          </button>
        </div>
      </div>
    </div>
  )
}
