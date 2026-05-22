import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBookings } from '../hooks'
import { formatBookingDateTime } from '../utils/bookingDateTime'
import '../../../styles/modules/booking/pages/BookingPages.css'

const TAB_CONFIG = {
  pending: {
    label: 'Chờ xử lý',
    status: ['PENDING'],
  },
  processing: {
    label: 'Đang thực hiện',
    status: ['ACCEPTED', 'PROCESSING', 'WAITING_CUSTOMER_CONFIRMATION'],
  },
  finished: {
    label: 'Đã kết thúc',
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
  if (
    status === 'FINISHED' ||
    status === 'DECLINED' ||
    status === 'CANCELLED'
  ) {
    return 'finished'
  }
  if (status === 'PENDING') return 'pending'
  return 'processing'
}

export function BookingActivityPage() {
  const [tab, setTab] = useState('pending')
  const { status } = TAB_CONFIG[tab]
  const { data, isLoading, isError, error, refetch } = useBookings({ status })

  const list = Array.isArray(data) ? data : []
  const statusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Chờ thợ phản hồi'
      case 'ACCEPTED': return 'Đã nhận việc'
      case 'PROCESSING': return 'Đang thực hiện'
      case 'WAITING_CUSTOMER_CONFIRMATION': return 'Chờ khách xác nhận'
      case 'FINISHED': return 'Hoàn thành'
      case 'DECLINED': return 'Đã từ chối'
      case 'CANCELLED': return 'Đã hủy'
      default: return status
    }
  }

  return (
    <section className="booking-page">
      <h1>Đặt lịch</h1>
      <p className="muted">Theo dõi đặt lịch theo trạng thái.</p>

      <div className="booking-tabs" role="tablist" aria-label="Bộ lọc đặt lịch">
        {Object.entries(TAB_CONFIG).map(([key, { label }]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'active' : ''}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <p className="muted">Đang tải…</p>}
      {isError && (
        <div className="booking-alert" role="alert">
          {error?.message || 'Không tải được danh sách.'}
          <button type="button" className="secondary" style={{ marginLeft: 12 }} onClick={() => refetch()}>
            Thử lại
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="booking-list">
          {list.length === 0 ? (
            <p className="muted">Không có đặt lịch trong mục này.</p>
          ) : (
            list.map((b) => (
              <Link key={b.id} to={`/app/bookings/${b.id}`} className="booking-card">
                <div className="booking-card-top">
                  <span className="booking-card-title">Đặt lịch · {b.id?.slice(0, 8)}…</span>
                  <span className={`booking-badge ${statusBadgeClass(b.status)}`}>{statusLabel(b.status)}</span>
                </div>
                <div className="booking-card-meta">
                  {b.address ? `${b.address.slice(0, 80)}${b.address.length > 80 ? '…' : ''}` : '—'}
                  <br />
                  {formatBookingDateTime(b.bookingDate ?? b.createdAt)}{' '}
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
