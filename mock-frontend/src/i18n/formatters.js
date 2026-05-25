export function getBrowserLocale(language) {
  if (language === 'ko') return 'ko-KR'
  if (language === 'en') return 'en-US'
  return 'vi-VN'
}

export function formatMoney(value, language) {
  if (value == null || value === '') return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return new Intl.NumberFormat(getBrowserLocale(language), {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatCoins(value, language, unitLabel) {
  const n = value == null ? 0 : Number(value)
  return `${new Intl.NumberFormat(getBrowserLocale(language), {
    maximumFractionDigits: 0,
  }).format(Number.isNaN(n) ? 0 : n)} ${unitLabel}`
}

export function formatDateTime(value, language, fallback = '-') {
  if (!value) return fallback
  return new Intl.DateTimeFormat(getBrowserLocale(language), {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDate(value, language, fallback = '-') {
  if (!value) return fallback
  return new Intl.DateTimeFormat(getBrowserLocale(language), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}
