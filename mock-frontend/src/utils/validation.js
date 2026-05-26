const fallbackT = (key) => key

export function validateUsername(username, t = fallbackT) {
  if (!username.trim()) return t('validation.username.required')
  if (username.length < 4 || username.length > 50) return t('validation.username.length')
  if (/\s/.test(username)) return t('validation.username.noWhitespace')
  return ''
}

export function validatePassword(password, t = fallbackT) {
  if (!password) return t('validation.password.required')
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
    return t('validation.password.weak')
  }
  return ''
}

export function validatePhone(phone, t = fallbackT) {
  if (!phone) return ''
  if (!/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(phone)) return t('validation.phone.invalid')
  return ''
}
