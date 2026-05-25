import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { confirmCompletion } from '../../../services/bookingService'
import { useLanguage } from '../../../i18n/LanguageContext'
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
  const { t } = useLanguage()
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
      setError(err?.message || t('customerConfirm.error'))
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
          {t('customerConfirm.title')}
        </h2>
        <p id="customer-confirm-message" className="booking-modal-hint">
          {t('customerConfirm.hint')}
        </p>

        <div className="booking-payment-summary">
          <div className="booking-payment-row">
            <span>{t('booking.serviceFee')}</span>
            <strong>{formatVnd(booking.totalAmount)}</strong>
          </div>
          {discount > 0 && (
            <div className="booking-payment-row">
              <span>{t('customerConfirm.voucherDiscount')}</span>
              <strong>-{formatVnd(discount)}</strong>
            </div>
          )}
          <div className="booking-payment-row highlight">
            <span>{t('customerConfirm.payCash')}</span>
            <strong>{formatVnd(finalAmount)}</strong>
          </div>
        </div>

        <p className="booking-cash-note">
          {t('customerConfirm.note')}
        </p>

        {error && (
          <div className="booking-alert" role="alert" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        <div className="booking-modal-actions booking-modal-actions--confirm">
          <button type="button" disabled={pending} onClick={onClose}>
            {t('customerConfirm.close')}
          </button>
          <button
            type="button"
            className="confirm"
            disabled={pending}
            onClick={handleConfirm}
          >
            {pending ? t('common.processing') : t('booking.confirmComplete')}
          </button>
        </div>
      </div>
    </div>
  )
}
