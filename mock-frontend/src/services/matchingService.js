import axiosClient from '../api/axiosClient'

export function getMatchingJobs(params) {
  return axiosClient.get('/api/matching/jobs', { params })
}
