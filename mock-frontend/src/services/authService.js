import axiosClient from '../api/axiosClient'

export function login(credentials) {
  return axiosClient.post('/api/auth/login', credentials)
}

export function googleLogin(accessToken, coords) {
  const payload = { accessToken }
  if (coords) {
    payload.latitude = coords.latitude
    payload.longitude = coords.longitude
  }
  return axiosClient.post('/api/auth/google-login', payload)
}

export function registerUser(payload) {
  const formData = new FormData()
  formData.append('role', 'USER')
  formData.append('username', payload.username)
  formData.append('email', payload.email)
  formData.append('password', payload.password)
  formData.append('fullName', payload.fullName)
  formData.append('phone', payload.phone)

  return axiosClient.post('/api/auth/register', formData)
}

export function registerWorker(payload) {
  const formData = new FormData()
  formData.append('role', 'WORKER')
  formData.append('username', payload.username)
  formData.append('email', payload.email)
  formData.append('password', payload.password)
  formData.append('fullName', payload.fullName)
  formData.append('phone', payload.phone)
  formData.append('jobType', payload.jobType)
  if (payload.professionalCertificate) {
    formData.append('professionalCertificate', payload.professionalCertificate)
  }

  return axiosClient.post('/api/auth/register', formData)
}

export function verifyEmail(payload) {
  return axiosClient.post('/api/auth/verify-email', payload)
}

export function resendVerification(payload) {
  return axiosClient.post('/api/auth/resend-verification', payload)
}

export function forgotPassword(payload) {
  return axiosClient.post('/api/auth/forgot-password', payload)
}

export function resetPassword(payload) {
  return axiosClient.post('/api/auth/reset-password', payload)
}

export function logout(refreshToken) {
  return axiosClient.post('/api/auth/logout', { refreshToken })
}
