import { Link } from 'react-router-dom'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useLanguage } from '../i18n/LanguageContext'

export function AccessDenied() {
  const { t } = useLanguage()

  return (
    <main className="landing-page">
      <LanguageSwitcher />
      <section>
        <p className="landing-eyebrow">403</p>
        <h1>{t('accessDenied.title')}</h1>
        <p>{t('accessDenied.description')}</p>
        <Link to="/">{t('accessDenied.backHome')}</Link>
      </section>
    </main>
  )
}
