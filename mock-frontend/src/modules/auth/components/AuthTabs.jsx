import '../../../styles/modules/auth/components/AuthTabs.css'
import { useLanguage } from '../../../i18n/LanguageContext'

const tabs = [
  { value: 'login', labelKey: 'common.signIn' },
  { value: 'user', labelKey: 'common.customer' },
  { value: 'worker', labelKey: 'common.worker' },
]

export function AuthTabs({ mode, onChange }) {
  const { t } = useLanguage()
  return (
    <div className="tabs" role="tablist" aria-label={t('auth.tabs.label')}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={mode === tab.value ? 'active' : ''}
          onClick={() => onChange(tab.value)}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  )
}
