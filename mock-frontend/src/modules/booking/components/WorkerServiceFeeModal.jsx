import { useState } from 'react'
import { useMarkCompleted } from '../hooks'
import '../pages/BookingPages.css'

function formatVnd(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

/**
 * Technician enters service fee before moving to WAITING_CUSTOMER_CONFIRMATION.
 */
export function WorkerServiceFeeModal({ open, bookingId, onClose }) {
  const [totalAmount, setTotalAmount] = useState('')
  const [error, setError] = useState('')
  const markCompletedMutation = useMarkCompleted()

  if (!open) return null

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const amount = Number(totalAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Vui lòng nhập phí dịch vụ lớn hơn 0.')
      return
    }

    markCompletedMutation.mutate(
      { bookingId, totalAmount: amount },
      {
        onSuccess: () => {
          setTotalAmount('')
          onClose()
        },
        onError: (err) => {
          setError(err?.message || 'Không thể gửi phí dịch vụ.')
        },
      },
    )
  }

  const busy = markCompletedMutation.isPending

  return (
    <div
      className="booking-modal-overlay"
      role="presentation"
      onClick={() => !busy && onClose()}
    >
      <div
        className="booking-modal booking-modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="worker-fee-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="worker-fee-title" style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>
          Báo phí dịch vụ
        </h2>
        <p className="booking-modal-hint">
          Nhập phí sau khi hoàn thành công việc. Khách hàng sẽ thấy số tiền và thanh toán tiền mặt trước khi xác nhận.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="booking-modal-field-label" htmlFor="service-fee-amount">
            Phí dịch vụ (VNĐ)
          </label>
          <input
            id="service-fee-amount"
            type="number"
            min="1"
            step="1"
            required
            placeholder="Ví dụ: 300000"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className="booking-modal-input"
          />

          {totalAmount && Number(totalAmount) > 0 && (
            <p className="booking-modal-preview">
              Khách thanh toán dự kiến: <strong>{formatVnd(totalAmount)}</strong>
              <span className="muted"> (đã trừ voucher nếu có)</span>
            </p>
          )}

          {error && (
            <div className="booking-alert" role="alert" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}

          <div className="booking-modal-actions" style={{ marginTop: 16 }}>
            <button type="button" disabled={busy} onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="confirm" disabled={busy}>
              {busy ? 'Đang gửi…' : 'Xác nhận phí & hoàn thành'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
