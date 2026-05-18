const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || 'Không thể kết nối đến máy chủ'
    const error = new Error(message)
    error.payload = payload
    throw error
  }

  return payload
}
