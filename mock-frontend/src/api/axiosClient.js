import axios from 'axios'
import { loadSession } from '../state/authStore'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosClient.interceptors.request.use((config) => {
  const session = loadSession()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const payload = error.response?.data
    const message = payload?.error?.message || 'Không thể kết nối đến máy chủ'
    const normalizedError = new Error(message)
    normalizedError.payload = payload
    normalizedError.status = error.response?.status
    return Promise.reject(normalizedError)
  },
)

export default axiosClient
