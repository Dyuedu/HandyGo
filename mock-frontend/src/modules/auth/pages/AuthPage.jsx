import { AlertMessage } from '../components/AlertMessage'
import { AuthBrandPanel } from '../components/AuthBrandPanel'
import { AuthSessionBar } from '../components/AuthSessionBar'
import { AuthTabs } from '../components/AuthTabs'
import '../components/AuthForms.css'
import { LoginForm } from '../components/LoginForm'
import { RegisterUserForm } from '../components/RegisterUserForm'
import { RegisterWorkerForm } from '../components/RegisterWorkerForm'
import { useAuthForms } from '../hooks/useAuthForms'
import { authModes } from './authContent'
import './AuthPage.css'

export function AuthPage() {
  const auth = useAuthForms()
  const currentMode = authModes[auth.mode]

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
