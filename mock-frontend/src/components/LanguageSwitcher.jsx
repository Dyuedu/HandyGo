import { useLanguage } from '../i18n/LanguageContext'
import '../styles/components/LanguageSwitcher.css'

export function LanguageSwitcher({ tone = 'light' }) {
  const { language, languages, setLanguage, t } = useLanguage()

  return (
    <label className={`language-switcher ${tone}`} title={t('language.switcherLabel')}>
      <span>{t('language.label')}</span>
      <select
        aria-label={t('language.switcherLabel')}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.shortLabel}
          </option>
        ))}
      </select>
    </label>
  )
}
