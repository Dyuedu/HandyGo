import { useState, useEffect } from 'react'
import {
  getSubscriptionPlans,
  subscribeToPlan,
  getWorkerSubscriptionInfo,
  getWalletBalance,
} from '../../../services/paymentService'
import { AppIcon } from '../../../components/AppIcon'
import { useLanguage } from '../../../i18n/LanguageContext'
import { formatCoins as formatCoinsValue, formatDate as formatLocalizedDate, formatMoney } from '../../../i18n/formatters'
import '../../../styles/pages/SubscriptionScreen.css'

export function SubscriptionScreen() {
  const { language, t } = useLanguage()
  const [plans, setPlans] = useState([])
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [walletBalance, setWalletBalance] = useState(null)
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
        console.error('Không thể tải thông tin gói cước:', err)
      }

      try {
        const walletData = await getWalletBalance()
        setWalletBalance(walletData?.balance ?? 0)
      } catch (err) {
        console.error('Không thể tải số xu hiện tại:', err)
        setWalletBalance(null)
      }
    } catch (err) {
      console.error('Không thể tải dữ liệu gói cước:', err)
      setError(t('subscription.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId, paymentMethod = 'VNPAY') => {
    try {
      setError(null)
      setSuccessMessage(null)
      setSubscribing(`${planId}:${paymentMethod}`)

      const response = await subscribeToPlan(planId, paymentMethod)
      if (response.paymentUrl) {
        setSuccessMessage(t('subscription.redirectVnpay'))
        window.location.href = response.paymentUrl
        return
      }

      if (response.subscription) {
        setCurrentSubscription(response.subscription)
      }
      setSuccessMessage(paymentMethod === 'WALLET'
        ? t('subscription.walletSuccess')
        : t('subscription.success'))

      // Reload plans to reflect any changes
      setTimeout(() => {
        loadSubscriptionData()
      }, 1500)
    } catch (err) {
      console.error('Không thể đăng ký gói:', err)
      setError(err.message || t('subscription.submitError'))
    } finally {
      setSubscribing(null)
    }
  }

  const formatCurrency = (value) => {
    return formatMoney(value ?? 0, language)
  }

  const getVirtualOriginalPrice = (price) => {
    const numericPrice = Number(price || 0)
    if (numericPrice <= 0) return null
    return Math.ceil((numericPrice / 0.8) / 1000) * 1000
  }

  const formatCoins = (value) => {
    return formatCoinsValue(value, language, t('wallet.coinUnit'))
  }

  const formatDate = (dateString) => {
    return formatLocalizedDate(dateString, language, t('subscription.unknown'))
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
        <h1>{t('subscription.title')}</h1>
        <p>{t('subscription.description')}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Current Subscription Info */}
      {currentSubscription && (
        <div className="current-subscription-card">
          <div className="subscription-info">
            <h2>{t('subscription.current')}</h2>
            <div className="subscription-details">
              <div className="detail-item">
                <span className="detail-label">{t('subscription.tier')}</span>
                <span className="detail-value tier-badge">{currentSubscription.tierType}</span>
              </div>
              {currentSubscription.tierExpiredAt && (
                <>
                  <div className="detail-item">
                    <span className="detail-label">{t('subscription.expiresAt')}</span>
                    <span className="detail-value">
                      {formatDate(currentSubscription.tierExpiredAt)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t('subscription.timeLeft')}</span>
                    <span className={`detail-value days-left ${isExpired(currentSubscription.tierExpiredAt) ? 'expired' : ''}`}>
                      {isExpired(currentSubscription.tierExpiredAt)
                        ? t('subscription.expired')
                        : t('subscription.days', { count: daysUntilExpiry(currentSubscription.tierExpiredAt) })}
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
        <div className="plans-title-row">
          <h2>{t('subscription.choose')}</h2>
          <span className="wallet-balance-pill">
            <AppIcon name="wallet" size={17} />
            {t('subscription.walletBalance', { amount: walletBalance === null ? t('subscription.unknown') : formatCoins(walletBalance) })}
          </span>
        </div>
        {loading ? (
          <div className="loading-state">
            <p>{t('subscription.loadingPlans')}</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <p>{t('subscription.emptyPlans')}</p>
          </div>
        ) : (
          <div className="plans-grid">
            {plans.map((plan) => {
              const isCurrent = currentSubscription?.tierType === plan.planName
              const originalPrice = getVirtualOriginalPrice(plan.price)
              const price = Number(plan.price || 0)
              const isFree = price <= 0
              const canPayWithCoins = walletBalance !== null && Number(walletBalance) >= price
              const vnpayKey = `${plan.id}:VNPAY`
              const walletKey = `${plan.id}:WALLET`
              return (
                <div key={plan.id} className={`plan-card ${isCurrent ? 'current' : ''}`}>
                  <div className="plan-header">
                    <div className="plan-title-line">
                      <h3 className="plan-name">{plan.planName}</h3>
                      {originalPrice && (
                        <span className="plan-original-price">{formatCurrency(originalPrice)}</span>
                      )}
                    </div>
                    {isCurrent && <span className="current-badge">{t('subscription.currentBadge')}</span>}
                  </div>

                  <div className="plan-price">
                    <span className="price-amount">{formatCurrency(plan.price)}</span>
                    {originalPrice && <span className="discount-badge">{t('subscription.save20')}</span>}
                    <span className="price-period">
                      {plan.durationDays === 1 ? t('subscription.perDay') : t('subscription.perDays', { count: plan.durationDays })}
                    </span>
                  </div>

                  <ul className="plan-features">
                    <li>✓ {t('subscription.featureTier')}: <strong>{plan.planName}</strong></li>
                    <li>✓ {t('subscription.featureDuration')}: <strong>{t('subscription.days', { count: plan.durationDays })}</strong></li>
                    {!isFree && <li>✓ {t('subscription.featureCoinPay')}: <strong>{formatCoins(plan.price)}</strong></li>}
                    <li>✓ {t('subscription.featurePriorityShow')}</li>
                    <li>✓ {t('subscription.featurePrioritySupport')}</li>
                  </ul>

                  <div className="subscribe-actions">
                    <button
                      className={`subscribe-btn ${isCurrent ? 'disabled' : ''}`}
                      onClick={() => handleSubscribe(plan.id, 'VNPAY')}
                      disabled={isCurrent || Boolean(subscribing)}
                    >
                      {isCurrent
                        ? t('subscription.currentBadge')
                        : subscribing === vnpayKey
                        ? isFree ? t('subscription.activating') : t('subscription.openingVnpay')
                        : isFree ? t('subscription.activateFree') : t('subscription.payVnpay')}
                    </button>
                    {!isFree && (
                      <button
                        className={`subscribe-btn coin-pay-btn ${isCurrent ? 'disabled' : ''}`}
                        onClick={() => handleSubscribe(plan.id, 'WALLET')}
                        disabled={isCurrent || Boolean(subscribing) || !canPayWithCoins}
                        title={!canPayWithCoins ? t('subscription.notEnoughTitle') : undefined}
                      >
                        {isCurrent
                          ? t('subscription.currentBadge')
                          : subscribing === walletKey
                          ? t('subscription.deducting')
                          : canPayWithCoins
                          ? t('subscription.payCoins')
                          : t('subscription.notEnoughCoins')}
                      </button>
                    )}
                  </div>

                  <p className="plan-info">{t('subscription.anytime')}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Benefits Section */}
      <div className="benefits-section">
        <h2>{t('subscription.benefitsTitle')}</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon"><AppIcon name="eye" size={28} /></div>
            <h3>{t('subscription.benefitSearchTitle')}</h3>
            <p>{t('subscription.benefitSearchDesc')}</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon"><AppIcon name="badge" size={28} /></div>
            <h3>{t('subscription.benefitBadgeTitle')}</h3>
            <p>{t('subscription.benefitBadgeDesc')}</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon"><AppIcon name="phone" size={28} /></div>
            <h3>{t('subscription.benefitSupportTitle')}</h3>
            <p>{t('subscription.benefitSupportDesc')}</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon"><AppIcon name="chart" size={28} /></div>
            <h3>{t('subscription.benefitStatsTitle')}</h3>
            <p>{t('subscription.benefitStatsDesc')}</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon"><AppIcon name="target" size={28} /></div>
            <h3>{t('subscription.benefitMarketingTitle')}</h3>
            <p>{t('subscription.benefitMarketingDesc')}</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon"><AppIcon name="smartphone" size={28} /></div>
            <h3>{t('subscription.benefitMobileTitle')}</h3>
            <p>{t('subscription.benefitMobileDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionScreen
