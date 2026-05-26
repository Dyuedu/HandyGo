import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCreateBooking } from '../modules/booking/hooks'
import {
  buildBookingDateTime,
  minTimeForDate,
  resolveBookingFormError,
  todayLocalDateString,
  validateBookingSchedule,
} from '../modules/booking/utils/bookingDateTime'
import { getPublicWorkerProfile } from '../services/profileService'
import { getUserLocations } from '../services/userService'
import { getAvailableVouchers } from '../services/voucherService'
import {
  createWorkerReview,
  getMyWorkerReviewStatus,
  getReviewsByWorkerId,
} from '../services/reviewService'
import { AppIcon } from '../components/AppIcon'
import { useLanguage } from '../i18n/LanguageContext'
import { getBrowserLocale } from '../i18n/formatters'
import '../styles/pages/WorkerProfile.css'

const translateJobType = (job, t) => {
  if (!job) return t('job.unknown')
  const j = job.trim().toUpperCase()
  return t(`${j}`) || job
}

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const emptyReviewStatus = {
  canReview: false,
  hasReview: false,
  hasFinishedBooking: false,
  review: null,
}

export function WorkerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { session, mode } = useAuth()
  const { language, t } = useLanguage()
  const locale = getBrowserLocale(language)

  const returnPath = location.state?.from || '/app/home'
  const returnLabel = location.state?.returnLabel
    || (returnPath.startsWith('/app/chat')
      ? t('worker.backChat')
      : returnPath === '/app/profile'
        ? t('worker.backProfile')
        : returnPath.includes('/job-posts/') && returnPath.includes('/applicants')
          ? t('jobpost.applicants.back')
          : t('worker.backMap'))

  const handleBack = () => {
    navigate(returnPath)
  }
  const createBookingMutation = useCreateBooking()
  const currentUserId = session?.id || localStorage.getItem('my_user_id')
  const isCustomer = mode === 'CUSTOMER'

  const [worker, setWorker] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [reviewStatus, setReviewStatus] = useState(isCustomer ? null : emptyReviewStatus)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  })
  const [reviewSubmitError, setReviewSubmitError] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(Boolean(location.state?.openBooking))
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    address: '',
    description: '',
    voucherId: '',
  })
  const [bookingError, setBookingError] = useState('')
  const [vouchers, setVouchers] = useState([])
  const [vouchersLoading, setVouchersLoading] = useState(false)
  const miniMapRef = useRef(null)
  const miniMapInstanceRef = useRef(null)

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        let found = null
        try {
          found = await getPublicWorkerProfile(id)
        } catch {
          const data = await getUserLocations()
          found = data.find((u) => u.id === id) || null
        }
        const data = await getUserLocations()
        const me = data.find((u) => u.id === currentUserId) || null
        setWorker(found)
        setCurrentUser(me)
      } catch (err) {
        console.error('Khong the tai du lieu tho', err)
      } finally {
        setLoading(false)
      }
    }
    fetchWorker()
  }, [id, currentUserId])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await getReviewsByWorkerId(id)
        if (!cancelled) setReviews(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Khong the tai danh gia cua tho', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!isCustomer) return

    let cancelled = false
    getMyWorkerReviewStatus(id)
      .then((data) => {
        if (!cancelled) {
          setReviewStatus({
            canReview: Boolean(data?.canReview),
            hasReview: Boolean(data?.hasReview),
            hasFinishedBooking: Boolean(data?.hasFinishedBooking),
            review: data?.review || null,
          })
        }
      })
      .catch(() => {
        if (!cancelled) setReviewStatus(emptyReviewStatus)
      })

    return () => { cancelled = true }
  }, [id, isCustomer])

  useEffect(() => {
    if (!bookingOpen || !isCustomer) return

    let cancelled = false
    setVouchersLoading(true)
    getAvailableVouchers()
      .then((data) => {
        if (!cancelled) setVouchers(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setVouchers([])
      })
      .finally(() => {
        if (!cancelled) setVouchersLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [bookingOpen, isCustomer])

  const selectedVoucher = vouchers.find((v) => String(v.id) === String(bookingData.voucherId))

  useEffect(() => {
    if (!worker?.latitude || !worker?.longitude || !miniMapRef.current || !window.L) return

    if (miniMapInstanceRef.current) {
      miniMapInstanceRef.current.remove()
      miniMapInstanceRef.current = null
    }

    const timer = setTimeout(() => {
      if (!miniMapRef.current) return
      const map = window.L.map(miniMapRef.current, {
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: false,
        attributionControl: false,
      }).setView([worker.latitude, worker.longitude], 15)

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      window.L.marker([worker.latitude, worker.longitude], {
        icon: window.L.divIcon({
          className: 'leaflet-custom-worker-marker',
          html: '<div class="worker-marker-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5 5L3 18v3h3l6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4z"/></svg></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      }).addTo(map)

      miniMapInstanceRef.current = map
      setTimeout(() => map.invalidateSize(), 100)
    }, 200)

    return () => {
      clearTimeout(timer)
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove()
        miniMapInstanceRef.current = null
      }
    }
  }, [worker])

  const reviewAvg = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
    : 0
  const avgRating = reviewAvg

  const distance = (currentUser && worker)
    ? calculateDistance(currentUser.latitude, currentUser.longitude, worker.latitude, worker.longitude)
    : null

  const handleBookingSubmit = (e) => {
    e.preventDefault()
    setBookingError('')

    const scheduleError = validateBookingSchedule(bookingData.date, bookingData.time, t)
    if (scheduleError) {
      setBookingError(scheduleError)
      return
    }

    if (!bookingData.address.trim()) {
      setBookingError(t('booking.validation.addressRequired'))
      return
    }

    const voucherId = bookingData.voucherId ? Number(bookingData.voucherId) : undefined

    const payload = {
      workerId: id,
      address: bookingData.address.trim(),
      bookingDate: buildBookingDateTime(bookingData.date, bookingData.time),
      description: bookingData.description.trim() || undefined,
      serviceCode: worker.jobType || undefined,
      ...(voucherId != null ? { voucherId } : {}),
    }

    createBookingMutation.mutate(payload, {
      onSuccess: (booking) => {
        if (booking?.id) {
          navigate(`/app/bookings/${booking.id}`)
        } else {
          navigate('/app/activity')
        }
      },
      onError: (err) => {
        setBookingError(resolveBookingFormError(err, t))
      },
    })
  }

  const handleWorkerReviewSubmit = async (e) => {
    e.preventDefault()
    if (!reviewStatus?.canReview || reviewSubmitting) return

    setReviewSubmitError('')
    setReviewSubmitting(true)

    try {
      const createdReview = await createWorkerReview(id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim() || undefined,
      })

      const nextReviews = [createdReview, ...reviews.filter((review) => review.id !== createdReview.id)]

      setReviews(nextReviews)
      setReviewStatus({
        canReview: false,
        hasReview: true,
        hasFinishedBooking: true,
        review: createdReview,
      })
      setWorker((prev) => (prev ? { ...prev, avgRating: createdReview.rating } : prev))
      setReviewForm({
        rating: 5,
        comment: '',
      })
    } catch (err) {
      setReviewSubmitError(err.message || t('worker.reviewSubmitError'))
    } finally {
      setReviewSubmitting(false)
    }
  }

  const renderStars = (rating, size = 16) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<span key={i} className="star filled" style={{ fontSize: size }}>★</span>)
      } else if (i - 0.5 <= rating) {
        stars.push(<span key={i} className="star half" style={{ fontSize: size }}>★</span>)
      } else {
        stars.push(<span key={i} className="star empty" style={{ fontSize: size }}>★</span>)
      }
    }
    return <span className="stars-row">{stars}</span>
  }

  if (loading) {
    return (
      <div className="wp-loading">
        <div className="wp-loading-spinner" />
        <p>{t('worker.loading')}</p>
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="wp-not-found">
        <span className="wp-not-found-icon">🔍</span>
        <h2>{t('worker.notFoundTitle')}</h2>
        <p>{t('worker.notFoundDesc')}</p>
        <button type="button" onClick={handleBack} className="wp-back-btn">← {returnLabel}</button>
      </div>
    )
  }

  return (
    <div className="wp-container">
      <button type="button" className="wp-back-link" onClick={handleBack}>
        ← {returnLabel}
      </button>

      <div className="wp-grid">
        <div className="wp-left">
          <div className="wp-hero-card">
            <div className="wp-hero-bg" />
            <div className="wp-hero-content">
              <div className="wp-avatar-large">
                {worker.fullName ? worker.fullName.substring(0, 2).toUpperCase() : '??'}
              </div>
              <h1 className="wp-name">{worker.fullName}</h1>
              <div className="wp-badges">
                <span className="wp-badge role">{t('worker.roleBadge')}</span>
                {worker.jobType && (
                  <span className="wp-badge job">{translateJobType(worker.jobType, t)}</span>
                )}
                {worker.verified && (
                  <span className="wp-badge verified">{t('profile.verified')}</span>
                )}
              </div>
              <div className="wp-rating-summary">
                {renderStars(avgRating, 18)}
                <span className="wp-rating-number">{avgRating.toFixed(1)}</span>
                <span className="wp-rating-count">{t('worker.reviewCount', { count: reviews.length })}</span>
              </div>
            </div>
          </div>

          <div className="wp-info-grid">
            <div className="wp-info-card">
              <div className="wp-info-icon"><AppIcon name="phone" size={22} /></div>
              <div className="wp-info-content">
                <span className="wp-info-label">{t('worker.phone')}</span>
                <span className="wp-info-value">{worker.phone || t('worker.notUpdated')}</span>
              </div>
            </div>
            <div className="wp-info-card">
              <div className="wp-info-icon"><AppIcon name="wrench" size={22} /></div>
              <div className="wp-info-content">
                <span className="wp-info-label">{t('worker.specialty')}</span>
                <span className="wp-info-value">{translateJobType(worker.jobType, t)}</span>
              </div>
            </div>
            <div className="wp-info-card">
              <div className="wp-info-icon"><AppIcon name="map" size={22} /></div>
              <div className="wp-info-content">
                <span className="wp-info-label">{t('worker.onlineStatus')}</span>
                <span className="wp-info-value">
                  {worker.latitude && worker.longitude ? (
                    <span className="wp-online">{t('worker.online')}</span>
                  ) : (
                    <span className="wp-offline">{t('worker.offline')}</span>
                  )}
                </span>
              </div>
            </div>
            {distance !== null && (
              <div className="wp-info-card highlight">
                <div className="wp-info-icon"><AppIcon name="target" size={22} /></div>
                <div className="wp-info-content">
                  <span className="wp-info-label">{t('worker.distance')}</span>
                  <span className="wp-info-value distance">{distance.toFixed(2)} km</span>
                </div>
              </div>
            )}
          </div>

          {worker.latitude && worker.longitude && (
            <div className="wp-map-section">
              <h3 className="wp-section-title"><AppIcon name="map" size={20} /> {t('worker.currentLocation')}</h3>
              <div className="wp-mini-map" ref={miniMapRef} />
            </div>
          )}
        </div>

        <div className="wp-right">
          <div className="wp-book-section">
            {!isCustomer && (
              <p className="wp-book-hint">{t('worker.customerOnly')}</p>
            )}

            {isCustomer && !bookingOpen && (
              <button className="wp-book-btn" onClick={() => { setBookingOpen(true); setBookingError('') }}>
                <AppIcon name="calendar" size={18} /> {t('worker.bookWith', { name: worker.fullName?.split(' ').pop() || t('common.worker') })}
              </button>
            )}

            {isCustomer && bookingOpen && (
              <form className="wp-booking-form" onSubmit={handleBookingSubmit}>
                <h3 className="wp-form-title"><AppIcon name="calendar" size={18} /> {t('worker.bookingTitle')}</h3>
                {bookingError && (
                  <div className="wp-form-error" role="alert">{bookingError}</div>
                )}
                <div className="wp-form-row">
                  <label>{t('worker.date')}</label>
                  <input
                    type="date"
                    required
                    value={bookingData.date}
                    min={todayLocalDateString()}
                    onChange={(e) => {
                      const date = e.target.value
                      setBookingData((prev) => {
                        const next = { ...prev, date }
                        const minTime = minTimeForDate(date)
                        if (minTime && prev.time && prev.time < minTime) {
                          next.time = minTime
                        }
                        return next
                      })
                      if (bookingError) setBookingError('')
                    }}
                  />
                </div>
                <div className="wp-form-row">
                  <label>{t('worker.time')}</label>
                  <input
                    type="time"
                    required
                    value={bookingData.time}
                    min={minTimeForDate(bookingData.date)}
                    onChange={(e) => {
                      setBookingData((prev) => ({ ...prev, time: e.target.value }))
                      if (bookingError) setBookingError('')
                    }}
                  />
                </div>
                <div className="wp-form-row">
                  <label>{t('worker.address')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('worker.addressPlaceholder')}
                    value={bookingData.address}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="wp-form-row">
                  <label>{t('worker.problem')}</label>
                  <textarea
                    rows={3}
                    placeholder={t('worker.problemPlaceholder')}
                    value={bookingData.description}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="wp-form-row">
                  <label>{t('worker.voucherOptional')}</label>
                  <select
                    value={bookingData.voucherId}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, voucherId: e.target.value }))}
                    className="wp-form-select"
                    disabled={vouchersLoading}
                  >
                    <option value="">{t('worker.noVoucher')}</option>
                    {vouchers.map((v) => (
                      <option key={v.id} value={String(v.id)}>
                        {v.code} - {v.discountPreview || t('worker.discount')}
                      </option>
                    ))}
                  </select>
                  {vouchersLoading && (
                    <p className="wp-voucher-hint">{t('worker.loadingVouchers')}</p>
                  )}
                  {!vouchersLoading && vouchers.length === 0 && (
                    <p className="wp-voucher-hint">{t('worker.noVouchers')}</p>
                  )}
                  {selectedVoucher && (
                    <p className="wp-voucher-preview">
                      {t('worker.offer')}: <strong>{selectedVoucher.discountPreview}</strong>
                      <span className="wp-voucher-preview-note">
                        {' '}- {t('worker.offerNote')}
                      </span>
                    </p>
                  )}
                </div>
                <div className="wp-form-actions">
                  <button
                    type="button"
                    className="wp-form-cancel"
                    disabled={createBookingMutation.isPending}
                    onClick={() => { setBookingOpen(false); setBookingError('') }}
                  >
                    {t('profile.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="wp-form-submit"
                    disabled={createBookingMutation.isPending}
                  >
                    {createBookingMutation.isPending ? t('worker.submitting') : t('worker.submitBooking')}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="wp-reviews-section">
            <h3 className="wp-section-title"><AppIcon name="badge" size={20} /> {t('worker.reviewsTitle')}</h3>
            <div className="wp-reviews-summary-bar">
              <div className="wp-avg-rating-big">
                <span className="wp-avg-number">{avgRating.toFixed(1)}</span>
                {renderStars(avgRating, 20)}
              </div>
              <span className="wp-total-reviews">{t('worker.reviewCount', { count: reviews.length })}</span>
            </div>

            {isCustomer && (
              <div className="wp-review-composer">
                <h4 className="wp-review-composer-title">{t('worker.reviewFormTitle')}</h4>
                {reviewStatus == null && (
                  <p className="wp-review-composer-note">{t('worker.reviewStatusLoading')}</p>
                )}
                {reviewStatus?.hasReview && (
                  <p className="wp-review-composer-note success">{t('worker.reviewAlreadySubmitted')}</p>
                )}
                {reviewStatus && !reviewStatus.hasReview && !reviewStatus.canReview && (
                  <p className="wp-review-composer-note">{t('worker.reviewEligibilityHint')}</p>
                )}
                {reviewStatus?.canReview && (
                  <form className="wp-review-form" onSubmit={handleWorkerReviewSubmit}>
                    <div className="wp-review-rating-input">
                      <span className="wp-review-label">{t('worker.reviewRatingLabel')}</span>
                      <div className="wp-review-star-picker" role="radiogroup" aria-label={t('worker.reviewRatingLabel')}>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={`wp-review-star-btn ${value <= reviewForm.rating ? 'active' : ''}`}
                            onClick={() => setReviewForm((prev) => ({ ...prev, rating: value }))}
                            aria-pressed={value === reviewForm.rating}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="wp-review-label" htmlFor="worker-review-comment">
                      {t('worker.reviewCommentLabel')}
                    </label>
                    <textarea
                      id="worker-review-comment"
                      rows={4}
                      className="wp-review-textarea"
                      placeholder={t('worker.reviewCommentPlaceholder')}
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                    />
                    {reviewSubmitError && (
                      <div className="wp-form-error" role="alert">{reviewSubmitError}</div>
                    )}
                    <button type="submit" className="wp-review-submit" disabled={reviewSubmitting}>
                      {reviewSubmitting ? t('worker.reviewSubmitting') : t('worker.reviewSubmit')}
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="wp-reviews-list">
              {reviews.length === 0 && (
                <div className="wp-review-empty">{t('worker.reviewEmpty')}</div>
              )}
              {reviews.map((review) => {
                const reviewer = review.reviewerName || t('common.customer')
                const date = review.createdAt ? new Date(review.createdAt).toLocaleDateString(locale) : ''
                return (
                  <div key={review.id || review.bookingId} className="wp-review-card">
                    <div className="wp-review-header">
                      <div className="wp-reviewer-avatar">
                        {reviewer.substring(0, 1)}
                      </div>
                      <div className="wp-reviewer-info">
                        <strong>{reviewer}</strong>
                        <span className="wp-review-date">{date}</span>
                      </div>
                      <div className="wp-review-rating">
                        {renderStars(review.rating, 14)}
                      </div>
                    </div>
                    <p className="wp-review-comment">{review.comment}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
