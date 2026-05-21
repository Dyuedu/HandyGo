import { useState } from 'react'
import { login as loginRequest, logout as logoutRequest, googleLogin as googleLoginRequest } from '../services/authService'
import { clearSession, loadSession, saveSession } from '../state/authStore'
import { AuthContext } from './authContextObject'

function resolveInitialMode(session) {
  if (!session?.accessToken) return 'CUSTOMER'
  if (session.role === 'ADMIN') return 'ADMIN'
  return session.role === 'WORKER' ? 'TECHNICIAN' : 'CUSTOMER'
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession)
  const [mode, setMode] = useState(() => resolveInitialMode(loadSession()))

  async function signIn(credentials) {
    const response = await loginRequest(credentials)
    saveSession(response.data)
    setSession(response.data)
    setMode(resolveInitialMode(response.data))
    return response
  }

  async function signInWithGoogle(accessToken) {
    const response = await googleLoginRequest(accessToken)
    saveSession(response.data)
    setSession(response.data)
    setMode(resolveInitialMode(response.data))
    return response
  }

  async function signOut() {
    if (session?.accessToken) {
      await logoutRequest(session.refreshToken)
    }
    clearSession()
    setSession(null)
    setMode('CUSTOMER')
  }

  function clearAuthSession() {
    clearSession()
    setSession(null)
    setMode('CUSTOMER')
  }

  const value = {
    session,
    isAuthenticated: Boolean(session?.accessToken),
    role: mode,
    mode,
    signIn,
    signInWithGoogle,
    signOut,
    clearAuthSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
