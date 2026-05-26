import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { login as loginRequest, logout as logoutRequest, googleLogin as googleLoginRequest } from '../services/authService'
import { clearSession, loadSession, saveSession, subscribeSessionChange } from '../state/authStore'
import { AuthContext } from './authContextObject'

function resolveInitialMode(session) {
  if (!session?.accessToken) return 'CUSTOMER'
  if (session.role === 'ADMIN') return 'ADMIN'
  return session.role === 'WORKER' ? 'TECHNICIAN' : 'CUSTOMER'
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(loadSession)
  const [mode, setMode] = useState(() => resolveInitialMode(loadSession()))

  useEffect(() => {
    return subscribeSessionChange((nextSession) => {
      setSession(nextSession)
      setMode(resolveInitialMode(nextSession))
    })
  }, [])

  async function signIn(credentials) {
    const response = await loginRequest(credentials)
    queryClient.clear()
    saveSession(response.data)
    setSession(response.data)
    setMode(resolveInitialMode(response.data))
    return response
  }

  async function signInWithGoogle(accessToken, coords) {
    const response = await googleLoginRequest(accessToken, coords)
    queryClient.clear()
    saveSession(response.data)
    setSession(response.data)
    setMode(resolveInitialMode(response.data))
    return response
  }

  async function signOut() {
    try {
      if (session?.accessToken) {
        await logoutRequest(session.refreshToken)
      }
    } catch (error) {
      console.warn('Logout request failed; clearing local session anyway.', error)
    } finally {
      queryClient.clear()
      clearSession()
    }
  }

  function clearAuthSession() {
    queryClient.clear()
    clearSession()
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
