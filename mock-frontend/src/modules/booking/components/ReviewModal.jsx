import { useState } from 'react'
import { useLanguage } from '../../../i18n/LanguageContext'
import '../pages/BookingDetailPage'

const STAR_COUNT = 5

export function ReviewModal({ open, onClose, onSubmit }) {
  const { t } = useLanguage()
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function handleSubmit() {
    if (!rating || rating < 1 || rating > STAR_COUNT) {
      setError(t('review.ratingError'))
      return
    }
    setError('')
    setPending(true)
    try {
      await onSubmit({ rating, comment: comment.trim() })
      setComment('')
      setRating(5)
      setHoverRating(0)
    } catch (e) {
      setError(e?.message || t('review.submitError'))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="booking-modal-overlay" role="presentation" onClick={() => !pending && onClose()}>
      <div
        className="booking-modal booking-modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="review-modal-title" style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>
          {t('review.title')}
        </h2>
        <p className="booking-modal-hint">
          {t('review.hint')}
        </p>

        <div className="review-stars-interactive" aria-label={t('review.chooseStars')}>
          {Array.from({ length: STAR_COUNT }, (_, index) => {
            const value = index + 1
            const filled = value <= (hoverRating || rating)
            return (
              <button
                key={value}
                type="button"
                className={filled ? 'review-star review-star--active' : 'review-star'}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={t('review.starLabel', { count: value })}
              >
                ★
              </button>
            )
          })}
        </div>

        <label className="booking-modal-field-label" htmlFor="review-comment">
          {t('review.comment')}
        </label>
        <textarea
          id="review-comment"
          className="booking-modal-input"
          rows="5"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t('review.placeholder')}
        />

        {error && (
          <div className="booking-alert" role="alert" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        <div className="booking-modal-actions booking-modal-actions--confirm">
          <button type="button" disabled={pending} onClick={onClose}>
            {t('profile.cancel')}
          </button>
          <button type="button" className="confirm" disabled={pending} onClick={handleSubmit}>
            {pending ? t('worker.submitting') : t('review.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
