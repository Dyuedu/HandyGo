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
import { getReviewsByWorkerId } from '../services/reviewService'
import { AppIcon } from '../components/AppIcon'
import '../styles/pages/WorkerProfile.css'

const translateJobType = (job) => {
  if (!job) return 'Chưa xác định'
  const j = job.trim().toUpperCase()
  switch (j) {
    case 'DIEN': return 'Thợ Điện'
    case 'NUOC': return 'Thợ Nước'
    case 'DIEU_HOA': return 'Thợ Điều hòa'
    case 'SUA_XE': return 'Thợ Sửa xe'
    case 'XAY_DUNG': return 'Thợ Xây dựng'
    case 'DON_DEP': return 'Dọn dẹp'
    default: return job
  }
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

// Mock reviews - In production, fetch from API
const generateMockReviews = (workerId) => {
  const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Hoàng C', 'Phạm Minh D', 'Huỳnh Thị E']
  const comments = [
    'Thợ làm việc rất chuyên nghiệp, đúng giờ và giá cả hợp lý.',
    'Sửa chữa nhanh gọn, tay nghề cao. Rất hài lòng!',
    'Thái độ phục vụ tốt, tư vấn nhiệt tình. Sẽ gọi lại lần sau.',
    'Đến đúng giờ hẹn, sửa xong sạch sẽ. Giá hợp lý.',
    'Kinh nghiệm dày dặn, xử lý vấn đề phức tạp rất tốt.',
  ]
  const seed = workerId ? workerId.charCodeAt(0) : 0
  const count = 3 + (seed % 3)
  return Array.from({ length: count }, (_, i) => ({
    id: `review-${i}`,
    reviewer: names[(seed + i) % names.length],
    rating: 4 + (((seed + i) % 2) * 0.5),
    comment: comments[(seed + i) % comments.length],
    date: new Date(Date.now() - (i + 1) * 86400000 * (3 + (seed % 5))).toLocaleDateString('vi-VN'),
  }))
}

export function WorkerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { session, mode } = useAuth()

  const returnPath = location.state?.from || '/app/home'
  const returnLabel = returnPath === '/app/profile' ? 'Quay lại hồ sơ' : 'Quay lại bản đồ'

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
  const [bookingOpen, setBookingOpen] = useState(false)
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
        console.error('Không thể tải dữ liệu thợ', err)
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
        console.error('Không thể tải đánh giá của thợ', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

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

  // Mini map for worker location
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
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0
  const avgRating =
    worker?.avgRating != null && Number(worker.avgRating) > 0
      ? Number(worker.avgRating)
      : reviewAvg

  const distance = (currentUser && worker)
    ? calculateDistance(currentUser.latitude, currentUser.longitude, worker.latitude, worker.longitude)
    : null

  const handleBookingSubmit = (e) => {
    e.preventDefault()
    setBookingError('')

    const scheduleError = validateBookingSchedule(bookingData.date, bookingData.time)
    if (scheduleError) {
      setBookingError(scheduleError)
      return
    }

    if (!bookingData.address.trim()) {
      setBookingError('Vui lòng nhập địa chỉ dịch vụ.')
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
        setBookingError(resolveBookingFormError(err))
      },
    })
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
        <p>Đang tải thông tin thợ...</p>
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="wp-not-found">
        <span className="wp-not-found-icon">🔍</span>
        <h2>Không tìm thấy thợ</h2>
        <p>Thông tin thợ không tồn tại hoặc đã bị xóa.</p>
        <button type="button" onClick={handleBack} className="wp-back-btn">← {returnLabel}</button>
      </div>
    )
  }

  return (
    <div className="wp-container">
      {/* Back navigation */}
      <button type="button" className="wp-back-link" onClick={handleBack}>
        ← {returnLabel}
      </button>

      <div className="wp-grid">
        {/* Left Column - Profile Info */}
        <div className="wp-left">
          {/* Hero Card */}
          <div className="wp-hero-card">
            <div className="wp-hero-bg" />
            <div className="wp-hero-content">
              <div className="wp-avatar-large">
                {worker.fullName ? worker.fullName.substring(0, 2).toUpperCase() : '??'}
              </div>
              <h1 className="wp-name">{worker.fullName}</h1>
              <div className="wp-badges">
                <span className="wp-badge role">Thợ sửa chữa</span>
                {worker.jobType && (
                  <span className="wp-badge job">{translateJobType(worker.jobType)}</span>
                )}
                {worker.verified && (
                  <span className="wp-badge verified">Đã xác minh</span>
                )}
              </div>
              <div className="wp-rating-summary">
                {renderStars(avgRating, 18)}
                <span className="wp-rating-number">{avgRating.toFixed(1)}</span>
                <span className="wp-rating-count">({reviews.length} đánh giá)</span>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="wp-info-grid">
            <div className="wp-info-card">
              <div className="wp-info-icon"><AppIcon name="phone" size={22} /></div>
              <div className="wp-info-content">
                <span className="wp-info-label">Số điện thoại</span>
                <span className="wp-info-value">{worker.phone || 'Chưa cập nhật'}</span>
              </div>
            </div>
            <div className="wp-info-card">
              <div className="wp-info-icon"><AppIcon name="wrench" size={22} /></div>
              <div className="wp-info-content">
                <span className="wp-info-label">Chuyên ngành</span>
                <span className="wp-info-value">{translateJobType(worker.jobType)}</span>
              </div>
            </div>
            <div className="wp-info-card">
              <div className="wp-info-icon"><AppIcon name="map" size={22} /></div>
              <div className="wp-info-content">
                <span className="wp-info-label">Trạng thái</span>
                <span className="wp-info-value">
                  {worker.latitude && worker.longitude ? (
                    <span className="wp-online">● Đang hoạt động</span>
                  ) : (
                    <span className="wp-offline">● Ngoại tuyến</span>
                  )}
                </span>
              </div>
            </div>
            {distance !== null && (
              <div className="wp-info-card highlight">
                <div className="wp-info-icon"><AppIcon name="target" size={22} /></div>
                <div className="wp-info-content">
                  <span className="wp-info-label">Khoảng cách đến bạn</span>
                  <span className="wp-info-value distance">{distance.toFixed(2)} km</span>
                </div>
              </div>
            )}
          </div>

          {/* Mini Map */}
          {worker.latitude && worker.longitude && (
            <div className="wp-map-section">
              <h3 className="wp-section-title"><AppIcon name="map" size={20} /> Vị trí hiện tại</h3>
              <div className="wp-mini-map" ref={miniMapRef} />
            </div>
          )}
        </div>

        {/* Right Column - Reviews & Booking */}
        <div className="wp-right">
          {/* Book Button */}
          <div className="wp-book-section">
            {!isCustomer && (
              <p className="wp-book-hint">Chỉ tài khoản khách hàng mới có thể đặt lịch.</p>
            )}

            {isCustomer && !bookingOpen && (
              <button className="wp-book-btn" onClick={() => { setBookingOpen(true); setBookingError('') }}>
                <AppIcon name="calendar" size={18} /> Đặt lịch với {worker.fullName?.split(' ').pop() || 'thợ'}
              </button>
            )}

            {isCustomer && bookingOpen && (
              <form className="wp-booking-form" onSubmit={handleBookingSubmit}>
                <h3 className="wp-form-title"><AppIcon name="calendar" size={18} /> Đặt lịch hẹn</h3>
                {bookingError && (
                  <div className="wp-form-error" role="alert">{bookingError}</div>
                )}
                <div className="wp-form-row">
                  <label>Ngày</label>
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
                  <label>Giờ</label>
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
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập địa chỉ của bạn..."
                    value={bookingData.address}
                    onChange={(e) => setBookingData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="wp-form-row">
                  <label>Mô tả vấn đề</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả ngắn gọn vấn đề cần sửa chữa..."
                    value={bookingData.description}
                    onChange={(e) => setBookingData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="wp-form-row">
                  <label>Voucher (tùy chọn)</label>
                  <select
                    value={bookingData.voucherId}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, voucherId: e.target.value }))}
                    className="wp-form-select"
                    disabled={vouchersLoading}
                  >
                    <option value="">Không dùng voucher</option>
                    {vouchers.map((v) => (
                      <option key={v.id} value={String(v.id)}>
                        {v.code} — {v.discountPreview || 'Giảm giá'}
                      </option>
                    ))}
                  </select>
                  {vouchersLoading && (
                    <p className="wp-voucher-hint">Đang tải danh sách voucher…</p>
                  )}
                  {!vouchersLoading && vouchers.length === 0 && (
                    <p className="wp-voucher-hint">Không có voucher khả dụng.</p>
                  )}
                  {selectedVoucher && (
                    <p className="wp-voucher-preview">
                      Ưu đãi: <strong>{selectedVoucher.discountPreview}</strong>
                      <span className="wp-voucher-preview-note">
                        {' '}— áp dụng khi thợ nhập phí dịch vụ
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
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="wp-form-submit"
                    disabled={createBookingMutation.isPending}
                  >
                    {createBookingMutation.isPending ? 'Đang gửi…' : 'Xác nhận đặt lịch'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Reviews */}
          <div className="wp-reviews-section">
            <h3 className="wp-section-title"><AppIcon name="badge" size={20} /> Đánh giá từ khách hàng</h3>
            <div className="wp-reviews-summary-bar">
              <div className="wp-avg-rating-big">
                <span className="wp-avg-number">{avgRating.toFixed(1)}</span>
                {renderStars(avgRating, 20)}
              </div>
              <span className="wp-total-reviews">{reviews.length} đánh giá</span>
            </div>

            <div className="wp-reviews-list">
                {reviews.map((review) => {
                  const reviewer = review.reviewerName || 'Khách hàng'
                  const date = review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : ''
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
