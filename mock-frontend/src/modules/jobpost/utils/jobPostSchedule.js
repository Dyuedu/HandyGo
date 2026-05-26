import {
  buildBookingDateTime,
  formatBookingDateTime,
  minTimeForDate,
  todayLocalDateString,
  validateBookingSchedule,
} from '../../booking/utils/bookingDateTime'

export {
  buildBookingDateTime,
  formatBookingDateTime,
  minTimeForDate,
  todayLocalDateString,
  validateBookingSchedule,
}

export function splitScheduledAt(iso) {
  if (!iso) return { date: '', time: '' }
  const raw = String(iso)
  const [datePart, timePart] = raw.includes('T') ? raw.split('T') : [raw, '']
  const time = timePart ? timePart.replace(/\.\d+.*$/, '').slice(0, 5) : ''
  return { date: datePart, time }
}

export function resolveJobPostApplyError(err, t) {
  const code = err?.payload?.error?.code
  if (code === 'JOBPOST_EXPIRED') {
    return t('jobpost.error.expired')
  }
  if (code === 'JOBPOST_NOT_OPEN' || code === 'JOBPOST_SCHEDULE_INVALID') {
    return err?.message || t('jobpost.error.notOpen')
  }
  return err?.message || t('jobpost.error.applyFailed')
}

export function resolveJobPostFormError(err, t) {
  const code = err?.payload?.error?.code
  if (code === 'JOBPOST_SCHEDULE_REQUIRED' || code === 'JOBPOST_SCHEDULE_INVALID') {
    return t('jobpost.validation.schedule')
  }
  return err?.message || t('jobpost.error.createFailed')
}
