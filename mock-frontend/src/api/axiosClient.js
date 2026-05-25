import axios from 'axios'
import { getStoredLanguage, translateStored } from '../i18n/LanguageContext'
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
  config.headers['Accept-Language'] = getStoredLanguage()

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const payload = error.response?.data
    const message = payload?.error?.message || payload?.error || translateStored('common.serverConnectionError')
    const normalizedError = new Error(message)
    normalizedError.payload = payload
    normalizedError.status = error.response?.status
    return Promise.reject(normalizedError)
  },
)

export default axiosClient
