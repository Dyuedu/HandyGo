import { useEffect } from 'react'
import { AlertMessage } from '../components/AlertMessage'
import { AuthBrandPanel } from '../components/AuthBrandPanel'
import { AuthTabs } from '../components/AuthTabs'
import '../../../styles/modules/auth/components/AuthForms.css'
import { LoginForm } from '../components/LoginForm'
import { VerifyEmailForm } from '../components/VerifyEmailForm'
import { UnverifiedPrompt } from '../components/UnverifiedPrompt'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { ResetPasswordForm } from '../components/ResetPasswordForm'
import { RegisterUserForm } from '../../customer/components/RegisterUserForm'
import { RegisterWorkerForm } from '../../worker/components/RegisterWorkerForm'
import { useAuthForms } from '../hooks/useAuthForms'
import { LanguageSwitcher } from '../../../components/LanguageSwitcher'
import { useLanguage } from '../../../i18n/LanguageContext'
import '../../../styles/modules/auth/pages/AuthPage.css'

export function AuthPage() {
  const auth = useAuthForms()
  const { t } = useLanguage()
  const currentMode = {
    eyebrow: t(`auth.${auth.mode}.eyebrow`),
    title: t(`auth.${auth.mode}.title`),
    description: t(`auth.${auth.mode}.description`),
    submit: t(`auth.${auth.mode}.submit`),
  }

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
      <div className="auth-language">
        <LanguageSwitcher />
      </div>
      <section className="auth-card" aria-label="Authentication">
        <AuthBrandPanel />

        <div className="form-panel">
          {(auth.mode !== 'verify' && auth.mode !== 'unverified' && auth.mode !== 'forgot' && auth.mode !== 'reset') && <AuthTabs mode={auth.mode} onChange={auth.setMode} />}

          <div className="form-heading">
            <p className="eyebrow">{currentMode.eyebrow}</p>
            <h2>{currentMode.title}</h2>
            <p>{currentMode.description}</p>
          </div>

          <AlertMessage type="success">{auth.message}</AlertMessage>
          <AlertMessage type="error">{auth.error}</AlertMessage>

          {auth.mode === 'login' && (
            <LoginForm
              form={auth.loginForm}
              onChange={auth.setLoginForm}
              onSubmit={auth.handleLogin}
              onForgotPassword={auth.goForgotPassword}
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

          {auth.mode === 'verify' && (
            <VerifyEmailForm
              form={auth.verifyForm}
              onChange={auth.setVerifyForm}
              onSubmit={auth.handleVerifyEmail}
              submitting={auth.submitting}
              submitLabel={currentMode.submit}
            />
          )}

          {auth.mode === 'unverified' && (
            <UnverifiedPrompt
              onResend={auth.handleResendVerification}
              submitting={auth.submitting}
            />
          )}

          {auth.mode === 'forgot' && (
            <ForgotPasswordForm
              form={auth.forgotForm}
              onChange={auth.setForgotForm}
              onSubmit={auth.handleForgotPassword}
              submitting={auth.submitting}
              submitLabel={currentMode.submit}
              onBackToLogin={auth.backToLogin}
            />
          )}

          {auth.mode === 'reset' && (
            <ResetPasswordForm
              form={auth.resetForm}
              onChange={auth.setResetForm}
              onSubmit={auth.handleResetPassword}
              submitting={auth.submitting}
              submitLabel={currentMode.submit}
              onBackToLogin={auth.backToLogin}
            />
          )}
        </div>
      </section>
    </main>
  )
}
