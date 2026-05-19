import axiosClient from '../api/axiosClient'

export function login(credentials) {
  return axiosClient.post('/api/auth/login', credentials)
}

export function googleLogin(accessToken) {
  return axiosClient.post('/api/auth/google-login', { accessToken })
}

export function registerUser(payload) {
  const formData = new FormData()
  formData.append('role', 'USER')
  formData.append('username', payload.username)
  formData.append('password', payload.password)
  formData.append('fullName', payload.fullName)
  formData.append('phone', payload.phone)

  return axiosClient.post('/api/auth/register', formData)
}

export function registerWorker(payload) {
  const formData = new FormData()
  formData.append('role', 'WORKER')
  formData.append('username', payload.username)
  formData.append('password', payload.password)
  formData.append('jobType', payload.jobType)
  if (payload.professionalCertificate) {
    formData.append('professionalCertificate', payload.professionalCertificate)
  }

  return axiosClient.post('/api/auth/register', formData)
}

export function logout(refreshToken) {
  return axiosClient.post('/api/auth/logout', { refreshToken })
}
