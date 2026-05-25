import { useState } from 'react'
import { useMarkCompleted } from '../hooks'
import { useLanguage } from '../../../i18n/LanguageContext'
import '../../../styles/modules/booking/pages/BookingPages.css'

function formatVnd(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

/**
 * Technician enters service fee before moving to WAITING_CUSTOMER_CONFIRMATION.
 */
export function WorkerServiceFeeModal({ open, bookingId, onClose }) {
  const { t } = useLanguage()
  const [totalAmount, setTotalAmount] = useState('')
  const [error, setError] = useState('')
  const markCompletedMutation = useMarkCompleted()

  if (!open) return null

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const amount = Number(totalAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t('workerFee.amountError'))
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
          setError(err?.message || t('workerFee.submitError'))
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
          {t('workerFee.title')}
        </h2>
        <p className="booking-modal-hint">
          {t('workerFee.hint')}
        </p>

        <form onSubmit={handleSubmit}>
          <label className="booking-modal-field-label" htmlFor="service-fee-amount">
            {t('workerFee.label')}
          </label>
          <input
            id="service-fee-amount"
            type="number"
            min="1"
            step="1"
            required
            placeholder={t('workerFee.placeholder')}
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className="booking-modal-input"
          />

          {totalAmount && Number(totalAmount) > 0 && (
            <p className="booking-modal-preview">
              {t('workerFee.preview')}: <strong>{formatVnd(totalAmount)}</strong>
              <span className="muted"> {t('workerFee.previewNote')}</span>
            </p>
          )}

          {error && (
            <div className="booking-alert" role="alert" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}

          <div className="booking-modal-actions" style={{ marginTop: 16 }}>
            <button type="button" disabled={busy} onClick={onClose}>
              {t('profile.cancel')}
            </button>
            <button type="submit" className="confirm" disabled={busy}>
              {busy ? t('worker.submitting') : t('workerFee.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
