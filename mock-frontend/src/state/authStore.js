const STORAGE_KEY = 'mock.auth.session'
const SESSION_CHANGE_EVENT = 'mock.auth.session.change'

function notifySessionChange(session) {
  window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT, { detail: session }))
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

export function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  notifySessionChange(session)
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem('my_user_id')
  notifySessionChange(null)
}

export function subscribeSessionChange(listener) {
  const handleSessionChange = (event) => listener(event.detail)
  const handleStorageChange = (event) => {
    if (event.key === STORAGE_KEY) {
      listener(loadSession())
    }
  }
  window.addEventListener(SESSION_CHANGE_EVENT, handleSessionChange)
  window.addEventListener('storage', handleStorageChange)
  return () => {
    window.removeEventListener(SESSION_CHANGE_EVENT, handleSessionChange)
    window.removeEventListener('storage', handleStorageChange)
  }
}
