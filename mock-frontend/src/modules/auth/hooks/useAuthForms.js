import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { registerUser, registerWorker } from '../../../services/authService'
import { authMessages } from '../../../constants/authMessages'
import { validatePassword, validatePhone, validateUsername } from '../../../utils/validation'

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

export function useAuthForms() {
  const { session, signIn, signInWithGoogle, signOut, clearAuthSession } = useAuth()
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
    const validation = validateUsername(loginForm.username) || (!loginForm.password ? 'Vui lòng nhập mật khẩu' : '')
    if (validation) return setError(validation)

    await submit(async () => {
      await signIn(loginForm)
      setMessage(authMessages.loginSuccess)
      setLoginForm(initialLogin)
      navigate('/app', { replace: true })
    })
  }

  async function handleGoogleLogin(accessToken) {
    await submit(async () => {
      await signInWithGoogle(accessToken)
      setMessage(authMessages.loginSuccess)
      navigate('/app', { replace: true })
    })
  }

  async function handleRegisterUser(event) {
    event.preventDefault()
    const validation =
      validateUsername(userForm.username) ||
      validatePassword(userForm.password) ||
      (!userForm.fullName.trim() ? 'Vui lòng nhập họ tên' : '') ||
      validatePhone(userForm.phone)
    if (validation) return setError(validation)

    await submit(async () => {
      await registerUser(userForm)
      setMessage(authMessages.registerSuccess)
      setUserForm(initialUser)
      setMode('login')
    })
  }

  async function handleRegisterWorker(event) {
    event.preventDefault()
    const validation =
      validateUsername(workerForm.username) ||
      validatePassword(workerForm.password) ||
      (!workerForm.fullName.trim() ? 'Vui lòng nhập họ tên' : '') ||
      validatePhone(workerForm.phone) ||
      (!workerForm.jobType.trim() ? 'Vui lòng nhập loại công việc' : '') ||
      (!workerForm.professionalCertificate ? 'Vui lòng tải lên chứng chỉ hành nghề' : '')
    if (validation) return setError(validation)

    await submit(async () => {
      await registerWorker(workerForm)
      setMessage(authMessages.registerSuccess)
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
      setMessage('Đã đăng xuất')
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
