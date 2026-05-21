import axiosClient from '../api/axiosClient'

export async function getWorkers() {
  const response = await axiosClient.get('/api/v1/admin/workers')
  return response || response.data // axiosClient might intercept and return response directly
}

export async function getWorkerById(workerId) {
  const response = await axiosClient.get(`/api/v1/admin/workers/${workerId}`)
  return response || response.data
}

export async function toggleWorkerVerification(workerId) {
  const response = await axiosClient.put(`/api/v1/admin/workers/${workerId}/verify`)
  return response || response.data
}

export async function toggleWorkerStatus(workerId) {
  const response = await axiosClient.put(`/api/v1/admin/workers/${workerId}/status`)
  return response || response.data
}
