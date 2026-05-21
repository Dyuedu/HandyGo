import { useEffect } from 'react'
import { AlertMessage } from '../components/AlertMessage'
import { AuthBrandPanel } from '../components/AuthBrandPanel'
import { AuthSessionBar } from '../components/AuthSessionBar'
import { AuthTabs } from '../components/AuthTabs'
import '../../../styles/modules/auth/components/AuthForms.css'
import { LoginForm } from '../components/LoginForm'
import { RegisterUserForm } from '../../customer/components/RegisterUserForm'
import { RegisterWorkerForm } from '../../worker/components/RegisterWorkerForm'
import { useAuthForms } from '../hooks/useAuthForms'
import { authModes } from './authContent'
import '../../../styles/modules/auth/pages/AuthPage.css'

export function AuthPage() {
  const auth = useAuthForms()
  const currentMode = authModes[auth.mode]

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      if (accessToken) {
        window.history.replaceState(null, null, window.location.pathname)
        auth.handleGoogleLogin(accessToken)
      }
    }
  }, [])

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-label="Authentication">
        <AuthBrandPanel />

        <div className="form-panel">
          <AuthTabs mode={auth.mode} onChange={auth.setMode} />

          <div className="form-heading">
            <p className="eyebrow">{currentMode.eyebrow}</p>
            <h2>{currentMode.title}</h2>
            <p>{currentMode.description}</p>
          </div>

          <AuthSessionBar session={auth.session} submitting={auth.submitting} onLogout={auth.handleLogout} />
          <AlertMessage type="success">{auth.message}</AlertMessage>
          <AlertMessage type="error">{auth.error}</AlertMessage>

          {auth.mode === 'login' && (
            <LoginForm
              form={auth.loginForm}
              onChange={auth.setLoginForm}
              onSubmit={auth.handleLogin}
              submitting={auth.submitting}
              submitLabel={currentMode.submit}
            />
          )}

          {auth.mode === 'user' && (
            <RegisterUserForm
              form={auth.userForm}
              onChange={auth.setUserForm}
              onSubmit={auth.handleRegisterUser}
              submitting={auth.submitting}
              submitLabel={currentMode.submit}
            />
          )}

          {auth.mode === 'worker' && (
            <RegisterWorkerForm
              form={auth.workerForm}
              onChange={auth.setWorkerForm}
              onSubmit={auth.handleRegisterWorker}
              submitting={auth.submitting}
              submitLabel={currentMode.submit}
            />
          )}
        </div>
      </section>
    </main>
  )
}
