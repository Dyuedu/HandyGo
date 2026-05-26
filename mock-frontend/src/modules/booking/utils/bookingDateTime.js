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
const fallbackT = (key) => key

export function validateBookingSchedule(date, time, t = fallbackT) {
  if (!date?.trim()) return t('booking.validation.dateRequired')
  if (!time?.trim()) return t('booking.validation.timeRequired')

  const scheduled = parseBookingDateTime(date, time)
  if (!scheduled) return t('booking.validation.invalidDateTime')

  const now = new Date()
  if (scheduled.getTime() < now.getTime()) {
    if (date === todayLocalDateString()) {
      return t('booking.validation.todayFuture')
    }
    return t('booking.validation.future')
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

export function formatBookingDateTime(value, locale = 'vi-VN') {
  if (value == null || value === '') return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(locale, {
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
export function resolveBookingFormError(err, t = fallbackT) {
  const error = err?.payload?.error
  const details = error?.details
  if (details && typeof details === 'object') {
    const fieldMsg = details.bookingDate || details.address
    if (fieldMsg) return fieldMsg
  }
  const code = error?.code
  const byCode = {
    BOOKING_DATE_REQUIRED: t('booking.validation.dateTimeRequired'),
    BOOKING_DATE_INVALID: t('booking.validation.todayFuture'),
    VALIDATION_FAILED: t('booking.validation.checkInfo'),
  }
  if (code && byCode[code]) return byCode[code]
  return err?.message || t('booking.validation.createError')
}
