import { request } from './httpClient'

export function login(credentials) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function registerUser(payload) {
  const formData = new FormData()
  formData.append('role', 'USER')
  formData.append('username', payload.username)
  formData.append('password', payload.password)
  formData.append('fullName', payload.fullName)
  formData.append('phone', payload.phone)

  return request('/api/auth/register', {
    method: 'POST',
    body: formData,
  })
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

  return request('/api/auth/register', {
    method: 'POST',
    body: formData,
  })
}

export function logout(accessToken, refreshToken) {
  return request('/api/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  })
}
