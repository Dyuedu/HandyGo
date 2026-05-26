import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useLanguage } from '../i18n/LanguageContext'
import '../styles/pages/Landing.css'

const features = ['booking', 'wallet', 'worker']

export function Landing() {
  const { isAuthenticated } = useAuth()
  const { t } = useLanguage()

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return (
    <main className="welcome-page">
      <span className="blur-circle circle-one" aria-hidden="true" />
      <span className="blur-circle circle-two" aria-hidden="true" />
      <span className="blur-circle circle-three" aria-hidden="true" />

      <header className="welcome-header">
        <Link to="/welcome" className="welcome-logo">HG</Link>
        <nav className="welcome-actions" aria-label={t('landing.actionLabel')}>
          <LanguageSwitcher tone="dark" />
          <Link to="/auth" className="ghost-link">{t('common.signIn')}</Link>
          <Link to="/auth" className="solid-link">{t('common.signUp')}</Link>
        </nav>
      </header>

      <section className="hero-section">
        <p className="landing-eyebrow">{t('landing.eyebrow')}</p>
        <h1>{t('landing.title')}</h1>
        <p>{t('landing.description')}</p>
        <div className="hero-actions">
          <Link to="/auth" className="cta-float">{t('landing.start')}</Link>
          <Link to="/auth" className="secondary-link">{t('landing.haveAccount')}</Link>
        </div>
      </section>

      <section className="feature-grid" aria-label="HomeGo">
        {features.map((feature) => (
          <article key={feature} className="feature-card">
            <span aria-hidden="true" />
            <h2>{t(`landing.feature.${feature}.title`)}</h2>
            <p>{t(`landing.feature.${feature}.description`)}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
