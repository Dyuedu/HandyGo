/** @returns {string} yyyy-MM-dd in local timezone */
export function todayLocalDateString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function buildBookingDateTime(date, time) {
  if (!date || !time) return null
  const normalizedTime = time.length === 5 ? `${time}:00` : time
  return `${date}T${normalizedTime}`
}

export function parseBookingDateTime(date, time) {
  const iso = buildBookingDateTime(date, time)
  if (!iso) return null
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Client-side validation before create booking.
 * @returns {string|null} Vietnamese error message or null if valid
 */
export function validateBookingSchedule(date, time) {
  if (!date?.trim()) return 'Vui lòng chọn ngày hẹn.'
  if (!time?.trim()) return 'Vui lòng chọn giờ hẹn.'

  const scheduled = parseBookingDateTime(date, time)
  if (!scheduled) return 'Ngày hoặc giờ không hợp lệ. Vui lòng kiểm tra lại.'

  const now = new Date()
  if (scheduled.getTime() < now.getTime()) {
    if (date === todayLocalDateString()) {
      return 'Giờ hẹn trong ngày hôm nay phải sau thời gian hiện tại.'
    }
    return 'Không thể chọn ngày hoặc giờ trong quá khứ.'
  }
  return null
}

/** Min value for `<input type="time">` when date is today (local). */
export function minTimeForDate(dateStr) {
  if (!dateStr || dateStr !== todayLocalDateString()) return undefined
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function formatBookingDateTime(value) {
  if (value == null || value === '') return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Map API error payload to a user-facing booking form message.
 */
export function resolveBookingFormError(err) {
  const error = err?.payload?.error
  const details = error?.details
  if (details && typeof details === 'object') {
    const fieldMsg = details.bookingDate || details.address
    if (fieldMsg) return fieldMsg
  }
  const code = error?.code
  const byCode = {
    BOOKING_DATE_REQUIRED: 'Vui lòng chọn ngày và giờ hẹn.',
    BOOKING_DATE_INVALID: 'Giờ hẹn không được trước thời gian hiện tại.',
    BOOKING_DUPLICATE:
      'Không thể đặt lịch: bạn đã có đơn với cùng ngày, giờ và địa chỉ.',
    WORKER_NOT_VERIFIED: 'Thợ chưa được duyệt chứng chỉ, không thể đặt lịch.',
    VALIDATION_FAILED: 'Vui lòng kiểm tra lại thông tin đặt lịch.',
  }
  if (code && byCode[code]) return byCode[code]
  return err?.message || 'Không thể tạo đặt lịch. Vui lòng thử lại.'
}
