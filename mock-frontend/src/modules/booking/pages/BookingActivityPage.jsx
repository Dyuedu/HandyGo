import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBookings } from '../hooks'
import { formatBookingDateTime } from '../utils/bookingDateTime'
import { useLanguage } from '../../../i18n/LanguageContext'
import { getBrowserLocale } from '../../../i18n/formatters'
import '../../../styles/modules/booking/pages/BookingPages.css'

const TAB_CONFIG = {
  pending: {
    labelKey: 'booking.tab.pending',
    status: ['PENDING'],
  },
  processing: {
    labelKey: 'booking.tab.processing',
    status: ['ACCEPTED', 'PROCESSING', 'WAITING_CUSTOMER_CONFIRMATION'],
  },
  finished: {
    labelKey: 'booking.tab.finished',
    status: ['FINISHED', 'DECLINED', 'CANCELLED'],
  },
}

function formatVnd(value) {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

function statusBadgeClass(status) {
  if (status === 'DECLINED') return 'declined'
  if (status === 'FINISHED' || status === 'CANCELLED') return 'finished'
  if (status === 'PENDING') return 'pending'
  return 'processing'
}

export function BookingActivityPage() {
  const { language, t } = useLanguage()
  const [tab, setTab] = useState('pending')
  const { status } = TAB_CONFIG[tab]
  const { data, isLoading, isError, error, refetch } = useBookings({ status })

  const list = Array.isArray(data) ? data : []
  const statusLabel = (status) => t(`status.${status}`) || status

  return (
    <section className="booking-page">
      <h1>{t('booking.title')}</h1>
      <p className="muted">{t('booking.description')}</p>

      <div className="booking-tabs" role="tablist" aria-label={t('booking.filterLabel')}>
        {Object.entries(TAB_CONFIG).map(([key, { labelKey }]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'active' : ''}
            onClick={() => setTab(key)}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {isLoading && <p className="muted">{t('booking.loading')}</p>}
      {isError && (
        <div className="booking-alert" role="alert">
          {error?.message || t('booking.listError')}
          <button type="button" className="secondary" style={{ marginLeft: 12 }} onClick={() => refetch()}>
            {t('booking.retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="booking-list">
          {list.length === 0 ? (
            <p className="muted">{t('booking.empty')}</p>
          ) : (
            list.map((b) => (
              <Link key={b.id} to={`/app/bookings/${b.id}`} className="booking-card">
                <div className="booking-card-top">
                  <span className="booking-card-title">{t('booking.cardTitle')} · {b.id?.slice(0, 8)}…</span>
                  <span className={`booking-badge ${statusBadgeClass(b.status)}`}>{statusLabel(b.status)}</span>
                </div>
                <div className="booking-card-meta">
                  {b.address ? `${b.address.slice(0, 80)}${b.address.length > 80 ? '…' : ''}` : '—'}
                  <br />
                  {formatBookingDateTime(b.bookingDate ?? b.createdAt, getBrowserLocale(language))}{' '}
                  · {formatVnd(b.finalAmount ?? b.totalAmount)}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </section>
  )
}
