import { useState, useEffect } from 'react'
import { getSubscriptionPlans, subscribeToplan, getWorkerSubscriptionInfo } from '../../../services/paymentService'
import '../../../styles/pages/SubscriptionScreen.css'

export function SubscriptionScreen() {
  const [plans, setPlans] = useState([])
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [loading, setLoading] = useState(false)
  const [subscribing, setSubscribing] = useState(null)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  useEffect(() => {
    loadSubscriptionData()
  }, [])

  const loadSubscriptionData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load available plans
      const plansData = await getSubscriptionPlans()
      setPlans(plansData || [])

      // Load current subscription info
      try {
        const subInfo = await getWorkerSubscriptionInfo()
        setCurrentSubscription(subInfo)
      } catch (err) {
        console.error('Failed to load subscription info:', err)
      }
    } catch (err) {
      console.error('Error loading subscription data:', err)
      setError('Failed to load subscription data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId) => {
    try {
      setError(null)
      setSuccessMessage(null)
      setSubscribing(planId)

      const response = await subscribeToplan(planId)
      setCurrentSubscription(response)
      setSuccessMessage('Successfully subscribed! Your tier has been updated.')

      // Reload plans to reflect any changes
      setTimeout(() => {
        loadSubscriptionData()
      }, 1500)
    } catch (err) {
      console.error('Error subscribing:', err)
      setError(err.response?.data?.message || 'Failed to subscribe. Please try again.')
    } finally {
      setSubscribing(null)
    }
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Không xác định'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  const daysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diff = expiry - now
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="subscription-screen">
      <div className="subscription-hero">
        <h1>Nâng cấp tài khoản</h1>
        <p>Chọn gói cước phù hợp để mở rộng khả năng của bạn</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Current Subscription Info */}
      {currentSubscription && (
        <div className="current-subscription-card">
          <div className="subscription-info">
            <h2>Gói cước hiện tại</h2>
            <div className="subscription-details">
              <div className="detail-item">
                <span className="detail-label">Hạng thành viên</span>
                <span className="detail-value tier-badge">{currentSubscription.tierType}</span>
              </div>
              {currentSubscription.tierExpiredAt && (
                <>
                  <div className="detail-item">
                    <span className="detail-label">Hết hạn vào</span>
                    <span className="detail-value">
                      {formatDate(currentSubscription.tierExpiredAt)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Thời gian còn lại</span>
                    <span className={`detail-value days-left ${isExpired(currentSubscription.tierExpiredAt) ? 'expired' : ''}`}>
                      {isExpired(currentSubscription.tierExpiredAt)
                        ? 'Đã hết hạn'
                        : `${daysUntilExpiry(currentSubscription.tierExpiredAt)} ngày`}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="plans-section">
        <h2>Chọn gói cước</h2>
        {loading ? (
          <div className="loading-state">
            <p>Đang tải gói cước...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <p>Không có gói cước nào khả dụng</p>
          </div>
        ) : (
          <div className="plans-grid">
            {plans.map((plan) => {
              const isCurrent = currentSubscription?.tierType === plan.planName
              return (
                <div key={plan.id} className={`plan-card ${isCurrent ? 'current' : ''}`}>
                  <div className="plan-header">
                    <h3 className="plan-name">{plan.planName}</h3>
                    {isCurrent && <span className="current-badge">Gói hiện tại</span>}
                  </div>

                  <div className="plan-price">
                    <span className="price-amount">{formatCurrency(plan.price)}</span>
                    <span className="price-period">
                      {plan.durationDays === 1 ? 'mỗi ngày' : `mỗi ${plan.durationDays} ngày`}
                    </span>
                  </div>

                  <ul className="plan-features">
                    <li>✓ Hạng thành viên: <strong>{plan.planName}</strong></li>
                    <li>✓ Thời hạn: <strong>{plan.durationDays} ngày</strong></li>
                    <li>✓ Ưu đãi: Được ưu tiên hiển thị</li>
                    <li>✓ Hỗ trợ: Ưu tiên cao</li>
                  </ul>

                  <button
                    className={`subscribe-btn ${isCurrent ? 'disabled' : ''}`}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent || subscribing === plan.id}
                  >
                    {isCurrent
                      ? 'Gói hiện tại'
                      : subscribing === plan.id
                      ? 'Đang xử lý...'
                      : 'Nâng cấp'}
                  </button>

                  <p className="plan-info">Bạn có thể nâng cấp bất kỳ lúc nào</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Benefits Section */}
      <div className="benefits-section">
        <h2>Lợi ích của việc nâng cấp</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">👀</div>
            <h3>Cao hơn trong tìm kiếm</h3>
            <p>Tài khoản nâng cấp được hiển thị ưu tiên trong danh sách tìm kiếm</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">⭐</div>
            <h3>Huy hiệu cao cấp</h3>
            <p>Hiển thị huy hiệu cao cấp trên hồ sơ và danh sách tìm kiếm</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">📞</div>
            <h3>Hỗ trợ ưu tiên</h3>
            <p>Nhận hỗ trợ từ đội ngũ hỗ trợ khách hàng với độ ưu tiên cao</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">📊</div>
            <h3>Thống kê chi tiết</h3>
            <p>Truy cập vào các thống kê chi tiết về lượt xem và tương tác</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🎯</div>
            <h3>Chiến dịch tiếp thị</h3>
            <p>Sử dụng công cụ tiếp thị nâng cao để quảng bá dịch vụ của bạn</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">📱</div>
            <h3>Ứng dụng di động</h3>
            <p>Truy cập ứng dụng di động chuyên dùng với tất cả các tính năng</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionScreen
