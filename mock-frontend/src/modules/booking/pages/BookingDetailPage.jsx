import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { CustomerConfirmationModal } from '../components/CustomerConfirmationModal'
import { ReviewModal } from '../components/ReviewModal'
import { WorkerServiceFeeModal } from '../components/WorkerServiceFeeModal'
import {
  useAcceptBooking,
  useBookingDetail,
  useDeclineBooking,
  useReview,
  useCreateReview,
  useStartProcessing,
} from '../hooks'
import { formatBookingDateTime } from '../utils/bookingDateTime'
import { useLanguage } from '../../../i18n/LanguageContext'
import { getBrowserLocale } from '../../../i18n/formatters'
import '../../../styles/modules/booking/pages/BookingPages.css'

function formatVnd(value) {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

function sameId(a, b) {
  if (a == null || b == null) return false
  return String(a) === String(b)
}

function hasServiceFee(booking) {
  const total = Number(booking?.totalAmount)
  return Number.isFinite(total) && total > 0
}

export function BookingDetailPage() {
  const { language, t } = useLanguage()
  const locale = getBrowserLocale(language)
  const { bookingId } = useParams()
  const { mode, session } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feeModalOpen, setFeeModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)

  const { data: booking, isLoading, isError, error } = useBookingDetail(bookingId)
  const reviewQuery = useReview(bookingId)
  const createReviewMutation = useCreateReview()

  const acceptMutation = useAcceptBooking()
  const declineMutation = useDeclineBooking()
  const startMutation = useStartProcessing()

  const isCustomer = mode === 'CUSTOMER'
  const isTechnician = mode === 'TECHNICIAN'

  const isAssignedWorker =
    isTechnician && booking?.worker && sameId(booking.worker.id, session?.id)
  const isCustomerParty =
    isCustomer && booking?.customer && sameId(booking.customer.id, session?.id)

  const busy =
    acceptMutation.isPending ||
    declineMutation.isPending ||
    startMutation.isPending

  const feeReady = hasServiceFee(booking)

  if (isLoading) {
    return (
      <section className="booking-page">
        <p className="muted">{t('booking.detailLoading')}</p>
      </section>
    )
  }

  if (isError || !booking) {
    return (
      <section className="booking-page">
        <div className="booking-alert" role="alert">
          {error?.message || t('booking.notFound')}
        </div>
        <Link to="/app/activity" className="booking-detail-back">
          ← {t('booking.backActivity')}
        </Link>
      </section>
    )
  }

  const st = booking.status
  const technician = booking.worker
  const voucher = booking.voucherUsage
  const serviceLabel = booking.serviceCode?.trim() || '—'

  return (
    <section className="booking-page">
      <Link to="/app/activity" className="booking-detail-back">
        ← {t('booking.backActivity')}
      </Link>

      <h1>{t('booking.detailTitle')}</h1>
      <p className="muted">{t('booking.id')}: {booking.id}</p>

      <div className="booking-detail-grid">
        <article className="booking-detail-card">
          <h2>{t('booking.status')}</h2>
          <div className="booking-detail-row">
            <dt>{t('booking.status')}</dt>
            <dd>{t(`status.${st}`)}</dd>
          </div>
          <div className="booking-detail-row">
            <dt>{t('booking.scheduledAt')}</dt>
            <dd>{formatBookingDateTime(booking.bookingDate, locale)}</dd>
          </div>
          {booking.createdAt && (
            <div className="booking-detail-row">
              <dt>{t('booking.createdAt')}</dt>
              <dd>{formatBookingDateTime(booking.createdAt, locale)}</dd>
            </div>
          )}
        </article>

        <article className="booking-detail-card">
          <h2>{t('booking.worker')}</h2>
          {technician ? (
            <>
              <div className="booking-detail-row">
                <dt>{t('profile.job')}</dt>
                <dd>{technician.jobType || '—'}</dd>
              </div>
              <div className="booking-detail-row">
                <dt>{t('profile.avgRating')}</dt>
                <dd>
                  {technician.avgRating != null ? Number(technician.avgRating).toFixed(1) : '—'}
                </dd>
              </div>
              <div className="booking-detail-row">
                <dt>{t('profile.verification')}</dt>
                <dd>{technician.isVerified ? t('profile.verified') : t('profile.pendingVerification')}</dd>
              </div>
            </>
          ) : (
            <p className="muted">—</p>
          )}
        </article>

        {isTechnician && booking.customer && (
          <article className="booking-detail-card">
            <h2>{t('booking.customer')}</h2>
            <div className="booking-detail-row">
              <dt>{t('profile.fullName')}</dt>
              <dd>{booking.customer.fullName || '—'}</dd>
            </div>
            <div className="booking-detail-row">
              <dt>{t('profile.phone')}</dt>
              <dd>{booking.customer.phone || '—'}</dd>
            </div>
          </article>
        )}

        <article className="booking-detail-card">
          <h2>{t('booking.address')}</h2>
          <div className="booking-detail-row">
            <dt>{t('booking.serviceAddress')}</dt>
            <dd>{booking.address?.trim() || '—'}</dd>
          </div>
        </article>

        <article className="booking-detail-card">
          <h2>{t('booking.service')}</h2>
          <div className="booking-detail-row">
            <dt>{t('booking.serviceCode')}</dt>
            <dd>{serviceLabel}</dd>
          </div>
          {feeReady ? (
            <>
              <div className="booking-detail-row">
                <dt>{t('booking.serviceFee')}</dt>
                <dd>{formatVnd(booking.totalAmount)}</dd>
              </div>
              <div className="booking-detail-row">
                <dt>{t('booking.discount')}</dt>
                <dd>{formatVnd(booking.discountAmount)}</dd>
              </div>
              <div className="booking-detail-row">
                <dt>{t('booking.cash')}</dt>
                <dd>{formatVnd(booking.finalAmount)}</dd>
              </div>
            </>
          ) : (
            <p className="muted">{t('booking.feePending')}</p>
          )}
        </article>

        {isCustomerParty && st === 'WAITING_CUSTOMER_CONFIRMATION' && feeReady && (
          <article className="booking-detail-card booking-payment-card">
            <h2>{t('booking.cashPayment')}</h2>
            <p className="booking-cash-instruction">
              {t('booking.cashInstruction', { amount: formatVnd(booking.finalAmount) })}
            </p>
            <div className="booking-payment-summary">
              <div className="booking-payment-row">
                <span>{t('booking.serviceFee')}</span>
                <strong>{formatVnd(booking.totalAmount)}</strong>
              </div>
              {Number(booking.discountAmount) > 0 && (
                <div className="booking-payment-row">
                  <span>{t('booking.voucher')}</span>
                  <strong>-{formatVnd(booking.discountAmount)}</strong>
                </div>
              )}
              <div className="booking-payment-row highlight">
                <span>{t('booking.cashToWorker')}</span>
                <strong>{formatVnd(booking.finalAmount)}</strong>
              </div>
            </div>
          </article>
        )}

        <article className="booking-detail-card">
          <h2>{t('booking.voucher')}</h2>
          {voucher?.voucher ? (
            <>
              <div className="booking-detail-row">
                <dt>{t('booking.code')}</dt>
                <dd>{voucher.voucher.code || '—'}</dd>
              </div>
              <div className="booking-detail-row">
                <dt>{t('booking.value')}</dt>
                <dd>{formatVnd(voucher.voucher.value)}</dd>
              </div>
              <div className="booking-detail-row">
                <dt>{t('booking.usageStatus')}</dt>
                <dd>{voucher.status}</dd>
              </div>
            </>
          ) : (
            <p className="muted">{t('booking.noVoucher')}</p>
          )}
        </article>

        {isCustomerParty && st === 'FINISHED' && (
          <article className="booking-detail-card review-card">
            <h2>{t('booking.yourReview')}</h2>
            {reviewQuery.isLoading ? (
              <p className="muted">{t('booking.checkingReview')}</p>
            ) : reviewQuery.data ? (
              <>
                <div className="review-stars">
                  {Array.from({ length: 5 }, (_, index) => (
                    <span key={index}>{index < reviewQuery.data.rating ? '★' : '☆'}</span>
                  ))}
                </div>
                {reviewQuery.data.comment ? (
                  <p className="review-comment">{reviewQuery.data.comment}</p>
                ) : (
                  <p className="muted">{t('booking.noReviewComment')}</p>
                )}
              </>
            ) : (
              <button
                type="button"
                className="review-btn"
                onClick={() => setReviewModalOpen(true)}
              >
                {t('booking.writeReview')}
              </button>
            )}
            {reviewQuery.isError && reviewQuery.error?.status !== 404 && (
              <div className="booking-alert" role="alert" style={{ marginTop: 12 }}>
                {reviewQuery.error?.message || t('booking.reviewLoadError')}
              </div>
            )}
          </article>
        )}
      </div>

      {isTechnician && isAssignedWorker && (
        <div className="booking-actions">
          {st === 'PENDING' && (
            <>
              <button
                type="button"
                className="primary"
                disabled={busy}
                onClick={() => acceptMutation.mutate(bookingId)}
              >
                {t('booking.accept')}
              </button>
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={() => declineMutation.mutate(bookingId)}
              >
                {t('booking.decline')}
              </button>
            </>
          )}
          {st === 'ACCEPTED' && (
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => startMutation.mutate(bookingId)}
            >
              {t('booking.start')}
            </button>
          )}
          {st === 'PROCESSING' && (
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => setFeeModalOpen(true)}
            >
              {t('booking.complete')}
            </button>
          )}
        </div>
      )}

      {isCustomer && isCustomerParty && st === 'WAITING_CUSTOMER_CONFIRMATION' && (
        <div className="booking-actions">
          <button
            type="button"
            className="primary"
            disabled={busy || confirmOpen}
            onClick={() => setConfirmOpen(true)}
          >
            {t('booking.confirmComplete')}
          </button>
        </div>
      )}

      <WorkerServiceFeeModal
        open={feeModalOpen}
        bookingId={bookingId}
        onClose={() => setFeeModalOpen(false)}
      />

      <CustomerConfirmationModal
        open={confirmOpen}
        bookingId={bookingId}
        booking={booking}
        onClose={() => setConfirmOpen(false)}
        onConfirmed={() => setReviewModalOpen(true)}
      />

      <ReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={async (payload) => {
          await createReviewMutation.mutateAsync({ bookingId, payload })
          setReviewModalOpen(false)
        }}
      />
    </section>
  )
}
