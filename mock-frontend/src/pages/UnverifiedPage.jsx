import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { AlertMessage } from '../modules/auth/components/AlertMessage'
import { AuthBrandPanel } from '../modules/auth/components/AuthBrandPanel'
import { useState } from 'react'
import '../styles/modules/auth/components/AuthForms.css'
import '../styles/modules/auth/pages/AuthPage.css'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export function UnverifiedPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const username = location.state?.username

  if (!username) {
    // If accessed directly without state, redirect to auth
    navigate('/auth', { replace: true })
    return null
  }

  const handleResend = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const { resendVerification } = await import('../services/authService')
      await resendVerification({ username })
      // Navigate to auth page with verify mode
      navigate('/auth', { 
        state: { 
          mode: 'verify', 
          email: username, 
          message: 'auth.success.resend' 
        } 
      })
    } catch (err) {
      const code = err?.payload?.error?.code
      const msg = code ? t(`error.${code}`) : err.message
      setError(msg)
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-language">
        <LanguageSwitcher />
      </div>
      <section className="auth-card" aria-label="Authentication">
        <AuthBrandPanel />

        <div className="form-panel">
          <div className="form-heading">
            <p className="eyebrow">{t('auth.unverified.eyebrow')}</p>
            <h2>{t('auth.unverified.title')}</h2>
            <p>{t('auth.unverified.description')}</p>
          </div>

          <AlertMessage type="error">{error}</AlertMessage>

          <div className="auth-form">
            <button className="primary-action" type="button" onClick={handleResend} disabled={submitting}>
              {submitting ? t('common.processing') : t('auth.unverified.submit')}
            </button>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button className="secondary" type="button" onClick={() => navigate('/auth')}>
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
