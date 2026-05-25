import { authHighlights } from '../pages/authContent'
import { useLanguage } from '../../../i18n/LanguageContext'
import '../../../styles/modules/auth/components/AuthBrandPanel.css'

export function AuthBrandPanel() {
  const { t } = useLanguage()
  return (
    <div className="brand-panel">
      <div className="brand-mark">M</div>
      <div className="brand-copy">
        <p className="eyebrow">{t('auth.brand.eyebrow')}</p>
        <h1>{t('auth.brand.title')}</h1>
        <p>{t('auth.brand.description')}</p>
      </div>
      <div className="brand-stats" aria-label={t('auth.brand.highlightsLabel')}>
        {authHighlights.map((highlight) => (
          <div key={highlight.title}>
            <strong>{highlight.title}</strong>
            <span>{t(highlight.descriptionKey)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
