import { useState } from 'react'
import '../pages/BookingPages.css'

const STAR_COUNT = 5

export function ReviewModal({ open, onClose, onSubmit }) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function handleSubmit() {
    if (!rating || rating < 1 || rating > STAR_COUNT) {
      setError('Vui lòng chọn đánh giá từ 1 đến 5 sao.')
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
      setError(e?.message || 'Không thể gửi đánh giá.')
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
          Đánh giá đơn hàng
        </h2>
        <p className="booking-modal-hint">
          Hãy cho thợ điểm số và nhận xét ngắn gọn về trải nghiệm làm việc.
        </p>

        <div className="review-stars-interactive" aria-label="Chọn số sao">
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
                aria-label={`${value} sao`}
              >
                ★
              </button>
            )
          })}
        </div>

        <label className="booking-modal-field-label" htmlFor="review-comment">
          Nhận xét (tùy chọn)
        </label>
        <textarea
          id="review-comment"
          className="booking-modal-input"
          rows="5"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Viết thêm cảm nhận của bạn..."
        />

        {error && (
          <div className="booking-alert" role="alert" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        <div className="booking-modal-actions booking-modal-actions--confirm">
          <button type="button" disabled={pending} onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="confirm" disabled={pending} onClick={handleSubmit}>
            {pending ? 'Đang gửi…' : 'Gửi đánh giá'}
          </button>
        </div>
      </div>
    </div>
  )
}
