import axiosClient from '../api/axiosClient'

export function getMyProfile() {
  return axiosClient.get('/api/v1/profile/me')
}

export function updateMyProfile(payload) {
  return axiosClient.put('/api/v1/profile/me', payload)
}

export function updateMyWorkerProfile(formData) {
  return axiosClient.put('/api/v1/profile/me/worker', formData)
}

export function getPublicWorkerProfile(workerId) {
  return axiosClient.get(`/api/v1/workers/${workerId}`)
}
