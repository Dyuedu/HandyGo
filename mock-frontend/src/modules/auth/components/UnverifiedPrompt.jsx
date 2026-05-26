import { useLanguage } from '../../../i18n/LanguageContext'

export function UnverifiedPrompt({ onResend, submitting }) {
  const { t } = useLanguage()
  return (
    <div className="auth-form">
      <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
        {t('auth.unverified.description')}
      </p>
      <button className="primary-action" type="button" onClick={onResend} disabled={submitting}>
        {submitting ? t('common.processing') : t('auth.unverified.submit')}
      </button>
    </div>
  )
}
