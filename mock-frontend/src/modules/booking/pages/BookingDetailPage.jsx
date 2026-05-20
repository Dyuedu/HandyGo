import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { CustomerConfirmationModal } from '../components/CustomerConfirmationModal'
import {
  useAcceptBooking,
  useBookingDetail,
  useDeclineBooking,
  useMarkCompleted,
  useStartProcessing,
} from '../hooks'
import './BookingPages.css'

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

export function BookingDetailPage() {
  const { bookingId } = useParams()
  const { mode, session } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: booking, isLoading, isError, error } = useBookingDetail(bookingId)

  const acceptMutation = useAcceptBooking()
  const declineMutation = useDeclineBooking()
  const startMutation = useStartProcessing()
  const completeMutation = useMarkCompleted()

  const isCustomer = mode === 'CUSTOMER'
  const isTechnician = mode === 'TECHNICIAN'

  const isAssignedWorker =
    isTechnician && booking?.worker && sameId(booking.worker.id, session?.id)
  const isCustomerParty =
    isCustomer && booking?.customer && sameId(booking.customer.id, session?.id)

  const busy =
    acceptMutation.isPending ||
    declineMutation.isPending ||
    startMutation.isPending ||
    completeMutation.isPending

  if (isLoading) {
    return (
      <section className="booking-page">
        <p className="muted">Đang tải chi tiết…</p>
      </section>
    )
  }

  if (isError || !booking) {
    return (
      <section className="booking-page">
        <div className="booking-alert" role="alert">
          {error?.message || 'Không tìm thấy đặt lịch.'}
        </div>
        <Link to="/app/activity" className="booking-detail-back">
          ← Quay lại Activity
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
        ← Quay lại Activity
      </Link>

      <h1>Chi tiết đặt lịch</h1>
      <p className="muted">Mã: {booking.id}</p>

      <div className="booking-detail-grid">
        <article className="booking-detail-card">
          <h2>Trạng thái</h2>
          <div className="booking-detail-row">
            <dt>Status</dt>
            <dd>{st}</dd>
          </div>
          {booking.createdAt && (
            <div className="booking-detail-row">
              <dt>Tạo lúc</dt>
              <dd>{new Date(booking.createdAt).toLocaleString('vi-VN')}</dd>
            </div>
          )}
        </article>

        <article className="booking-detail-card">
          <h2>Thợ (technician)</h2>
          {technician ? (
            <>
              <div className="booking-detail-row">
                <dt>Loại nghề</dt>
                <dd>{technician.jobType || '—'}</dd>
              </div>
              <div className="booking-detail-row">
                <dt>Đánh giá TB</dt>
                <dd>
                  {technician.avgRating != null ? Number(technician.avgRating).toFixed(1) : '—'}
                </dd>
              </div>
              <div className="booking-detail-row">
                <dt>Xác minh</dt>
                <dd>{technician.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}</dd>
              </div>
            </>
          ) : (
            <p className="muted">—</p>
          )}
        </article>

        {isTechnician && booking.customer && (
          <article className="booking-detail-card">
            <h2>Khách hàng</h2>
            <div className="booking-detail-row">
              <dt>Họ tên</dt>
              <dd>{booking.customer.fullName || '—'}</dd>
            </div>
            <div className="booking-detail-row">
              <dt>Số điện thoại</dt>
              <dd>{booking.customer.phone || '—'}</dd>
            </div>
          </article>
        )}

        <article className="booking-detail-card">
          <h2>Địa chỉ</h2>
          <div className="booking-detail-row">
            <dt>Địa chỉ dịch vụ</dt>
            <dd>{booking.address?.trim() || '—'}</dd>
          </div>
        </article>

        <article className="booking-detail-card">
          <h2>Dịch vụ</h2>
          <div className="booking-detail-row">
            <dt>Mã / tên dịch vụ (tạm)</dt>
            <dd>{serviceLabel}</dd>
          </div>
          <div className="booking-detail-row">
            <dt>Phí dịch vụ</dt>
            <dd>{formatVnd(booking.totalAmount)}</dd>
          </div>
          <div className="booking-detail-row">
            <dt>Giảm giá</dt>
            <dd>{formatVnd(booking.discountAmount)}</dd>
          </div>
          <div className="booking-detail-row">
            <dt>Khách trả (tiền mặt)</dt>
            <dd>{formatVnd(booking.finalAmount)}</dd>
          </div>
        </article>

        <article className="booking-detail-card">
          <h2>Voucher</h2>
          {voucher?.voucher ? (
            <>
              <div className="booking-detail-row">
                <dt>Mã</dt>
                <dd>{voucher.voucher.code || '—'}</dd>
              </div>
              <div className="booking-detail-row">
                <dt>Giá trị</dt>
                <dd>{formatVnd(voucher.voucher.value)}</dd>
              </div>
              <div className="booking-detail-row">
                <dt>Trạng thái sử dụng</dt>
                <dd>{voucher.status}</dd>
              </div>
            </>
          ) : (
            <p className="muted">Không áp dụng voucher.</p>
          )}
        </article>
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
                Accept
              </button>
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={() => declineMutation.mutate(bookingId)}
              >
                Decline
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
              Start Processing
            </button>
          )}
          {st === 'PROCESSING' && (
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => completeMutation.mutate(bookingId)}
            >
              Mark Completed
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
            Confirm Completion
          </button>
        </div>
      )}

      <CustomerConfirmationModal
        open={confirmOpen}
        bookingId={bookingId}
        onClose={() => setConfirmOpen(false)}
      />
    </section>
  )
}
