import { useState } from 'react'
import { login, logout, registerUser, registerWorker } from '../api/auth'
import { authMessages } from '../constants/authMessages'
import { clearSession, loadSession, saveSession } from '../state/authStore'
import { validatePassword, validatePhone, validateUsername } from '../utils/validation'

const initialLogin = { username: '', password: '' }
const initialUser = { username: '', password: '', fullName: '', phone: '' }
const initialWorker = {
  username: '',
  password: '',
  jobType: '',
  professionalCertificate: null,
}

export function useAuthForms() {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(initialLogin)
  const [userForm, setUserForm] = useState(initialUser)
  const [workerForm, setWorkerForm] = useState(initialWorker)
  const [session, setSession] = useState(loadSession)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()
    const validation = validateUsername(loginForm.username) || (!loginForm.password ? 'Vui lòng nhập mật khẩu' : '')
    if (validation) return setError(validation)

    await submit(async () => {
      const response = await login(loginForm)
      saveSession(response.data)
      setSession(response.data)
      setMessage(authMessages.loginSuccess)
      setLoginForm(initialLogin)
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
      clearSession()
      setSession(null)
      return
    }

    await submit(async () => {
      await logout(session.accessToken, session.refreshToken)
      clearSession()
      setSession(null)
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
    handleRegisterUser,
    handleRegisterWorker,
    handleLogout,
  }
}
