import { useState } from 'react'
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

export function useAuthForms() {
  const { session, signIn, signInWithGoogle, signOut, clearAuthSession } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(initialLogin)
  const [userForm, setUserForm] = useState(initialUser)
  const [workerForm, setWorkerForm] = useState(initialWorker)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()
    const validation = validateUsername(loginForm.username, t) || (!loginForm.password ? t('validation.password.required') : '')
    if (validation) return setError(validation)

    await submit(async () => {
      const coords = await getCoordinates()
      const loginPayload = coords
        ? { ...loginForm, latitude: coords.latitude, longitude: coords.longitude }
        : loginForm

      await signIn(loginPayload)
      setMessage(t('auth.success.login'))
      setLoginForm(initialLogin)
      navigate('/app', { replace: true })
    })
  }

  async function handleGoogleLogin(accessToken) {
    await submit(async () => {
      const coords = await getCoordinates()
      await signInWithGoogle(accessToken, coords)
      setMessage(t('auth.success.login'))
      navigate('/app', { replace: true })
    })
  }

  async function handleRegisterUser(event) {
    event.preventDefault()
    const validation =
      validateUsername(userForm.username, t) ||
      validatePassword(userForm.password, t) ||
      (!userForm.fullName.trim() ? t('validation.fullName.required') : '') ||
      validatePhone(userForm.phone, t)
    if (validation) return setError(validation)

    await submit(async () => {
      await registerUser(userForm)
      setMessage(t('auth.success.register'))
      setUserForm(initialUser)
      setMode('login')
    })
  }

  async function handleRegisterWorker(event) {
    event.preventDefault()
    const validation =
      validateUsername(workerForm.username, t) ||
      validatePassword(workerForm.password, t) ||
      (!workerForm.fullName.trim() ? t('validation.fullName.required') : '') ||
      validatePhone(workerForm.phone, t) ||
      (!workerForm.jobType.trim() ? t('validation.jobType.required') : '') ||
      (!workerForm.professionalCertificate ? t('validation.certificate.required') : '')
    if (validation) return setError(validation)

    await submit(async () => {
      await registerWorker(workerForm)
      setMessage(t('auth.success.register'))
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
      setMessage(t('auth.success.logout'))
    })
  }

  async function submit(action) {
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      await action()
    } catch (err) {
      setError(err.message)
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
    message,
    error,
    submitting,
    handleLogin,
    handleGoogleLogin,
    handleRegisterUser,
    handleRegisterWorker,
    handleLogout,
  }
}
