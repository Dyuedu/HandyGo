import axios from 'axios'
import { getStoredLanguage, translateStored } from '../i18n/LanguageContext'
import { clearSession, loadSession, saveSession } from '../state/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise = null

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

function normalizeError(error) {
  const payload = error.response?.data
  const message = payload?.error?.message || payload?.error || translateStored('common.serverConnectionError')
  const normalizedError = new Error(message)
  normalizedError.payload = payload
  normalizedError.status = error.response?.status
  return normalizedError
}

async function refreshSession(refreshToken) {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post(
        '/api/auth/refresh',
        { refreshToken },
        { headers: { 'Accept-Language': getStoredLanguage() } },
      )
      .then((response) => {
        const nextSession = response.data?.data
        if (!nextSession?.accessToken) {
          throw new Error(translateStored('common.serverConnectionError'))
        }
        saveSession(nextSession)
        return nextSession
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

function shouldRefresh(error, originalRequest, session) {
  if (error.response?.status !== 401 || originalRequest._retry || !session?.refreshToken) {
    return false
  }

  const url = originalRequest.url || ''
  return !url.startsWith('/api/auth/login')
    && !url.startsWith('/api/auth/register')
    && !url.startsWith('/api/auth/google-login')
    && !url.startsWith('/api/auth/refresh')
}

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config || {}
    const session = loadSession()

    if (shouldRefresh(error, originalRequest, session)) {
      originalRequest._retry = true

      try {
        const nextSession = await refreshSession(session.refreshToken)
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${nextSession.accessToken}`

        if (originalRequest.url === '/api/auth/logout') {
          originalRequest.data = { refreshToken: nextSession.refreshToken }
        }

        return axiosClient(originalRequest)
      } catch (refreshError) {
        clearSession()
        return Promise.reject(normalizeError(refreshError))
      }
    }

    return Promise.reject(normalizeError(error))
  },
)

export default axiosClient
