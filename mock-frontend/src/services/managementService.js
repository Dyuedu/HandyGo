import axiosClient from '../api/axiosClient'

export function getProfile() {
  return axiosClient.get('/api/profile')
}
