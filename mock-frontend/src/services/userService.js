import axiosClient from '../api/axiosClient'

export function updateLocation(latitude, longitude) {
  return axiosClient.put('/api/v1/users/location', { latitude, longitude })
}

export function getUserLocations() {
  return axiosClient.get('/api/v1/users/locations')
}
