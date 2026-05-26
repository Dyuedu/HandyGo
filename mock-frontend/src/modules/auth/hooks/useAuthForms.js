import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { registerUser, registerWorker } from '../../../services/authService'
import { validatePassword, validatePhone, validateUsername } from '../../../utils/validation'
import { useLanguage } from '../../../i18n/LanguageContext'

const initialLogin = { username: '', password: '' }
const initialUser = { username: '', password: '', fullName: '', phone: '' }
const initialWorker = {
  username: '',
  password: '',
  fullName: '',
  phone: '',
  jobType: '',
  professionalCertificate: null,
}

const getCoordinates = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000 }
    )
  })
}

const validationT = (key) => key

function translateNotice(notice, t) {
  if (!notice) return ''
  if (typeof notice === 'string') return notice
  if (notice.key) {
    const translated = t(notice.key)
    return translated === notice.key ? notice.fallback || translated : translated
  }
  return notice.fallback || ''
}

function backendErrorNotice(err) {
  const code = err?.payload?.error?.code
  if (code) {
    return {
      key: `error.${code}`,
      fallback: err?.payload?.error?.message || err.message,
    }
  }
  return { fallback: err?.message || '' }
}

export function useAuthForms() {
  const { session, signIn, signInWithGoogle, signOut, clearAuthSession } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(initialLogin)
  const [userForm, setUserForm] = useState(initialUser)
  const [workerForm, setWorkerForm] = useState(initialWorker)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const translatedMessage = useMemo(() => translateNotice(message, t), [message, t])
  const translatedError = useMemo(() => translateNotice(error, t), [error, t])

  async function handleLogin(event) {
    event.preventDefault()
    const validation = validateUsername(loginForm.username, validationT) || (!loginForm.password ? 'validation.password.required' : '')
    if (validation) return setError({ key: validation })

    await submit(async () => {
      const coords = await getCoordinates()
      const loginPayload = coords
        ? { ...loginForm, latitude: coords.latitude, longitude: coords.longitude }
        : loginForm

      await signIn(loginPayload)
      setMessage({ key: 'auth.success.login' })
      setLoginForm(initialLogin)
      navigate('/app', { replace: true })
    })
  }

  async function handleGoogleLogin(accessToken) {
    await submit(async () => {
      const coords = await getCoordinates()
      await signInWithGoogle(accessToken, coords)
      setMessage({ key: 'auth.success.login' })
      navigate('/app', { replace: true })
    })
  }

  async function handleRegisterUser(event) {
    event.preventDefault()
    const validation =
      validateUsername(userForm.username, validationT) ||
      validatePassword(userForm.password, validationT) ||
      (!userForm.fullName.trim() ? 'validation.fullName.required' : '') ||
      validatePhone(userForm.phone, validationT)
    if (validation) return setError({ key: validation })

    await submit(async () => {
      await registerUser(userForm)
      setMessage({ key: 'auth.success.register' })
      setUserForm(initialUser)
      setMode('login')
    })
  }

  async function handleRegisterWorker(event) {
    event.preventDefault()
    const validation =
      validateUsername(workerForm.username, validationT) ||
      validatePassword(workerForm.password, validationT) ||
      (!workerForm.fullName.trim() ? 'validation.fullName.required' : '') ||
      validatePhone(workerForm.phone, validationT) ||
      (!workerForm.jobType.trim() ? 'validation.jobType.required' : '') ||
      (!workerForm.professionalCertificate ? 'validation.certificate.required' : '')
    if (validation) return setError({ key: validation })

    await submit(async () => {
      await registerWorker(workerForm)
      setMessage({ key: 'auth.success.register' })
      setWorkerForm(initialWorker)
      setMode('login')
    })
  }

  async function handleLogout() {
    if (!session?.accessToken) {
      clearAuthSession()
      return
    }

    await submit(async () => {
      await signOut()
      setMessage({ key: 'auth.success.logout' })
    })
  }

  async function submit(action) {
    setSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      await action()
    } catch (err) {
      setError(backendErrorNotice(err))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    mode,
    setMode,
    loginForm,
    setLoginForm,
    userForm,
    setUserForm,
    workerForm,
    setWorkerForm,
    session,
    message: translatedMessage,
    error: translatedError,
    submitting,
    handleLogin,
    handleGoogleLogin,
    handleRegisterUser,
    handleRegisterWorker,
    handleLogout,
  }
}
