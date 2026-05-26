import { useLanguage } from '../../../i18n/LanguageContext'
import '../../../styles/modules/auth/components/AuthSessionBar.css'

export function AuthSessionBar({ session, submitting, onLogout }) {
  const { t } = useLanguage()
  if (!session) return null

  return (
    <div className="session-bar">
      <div>
        <strong>{t('auth.session.active')}</strong>
        {session.workerVerificationStatus && (
          <span>{session.workerVerificationStatus === 'PENDING' ? t('auth.session.workerPending') : t('auth.session.workerVerified')}</span>
        )}
      </div>
      <button type="button" className="secondary" onClick={onLogout} disabled={submitting}>
        {t('common.signOut')}
      </button>
    </div>
  )
}
