import '../../../styles/modules/auth/components/Field.css'
import { useLanguage } from '../../../i18n/LanguageContext'

export function FileField({ label, file, onChange }) {
  const { t } = useLanguage()
  return (
    <label className="field">
      <span>{label}</span>
      <span className="upload-box">
        <input type="file" accept="application/pdf,image/*" onChange={(event) => onChange(event.target.files?.[0] || null)} />
        <strong>{file ? file.name : t('file.choose')}</strong>
        <small>{file ? `${Math.max(file.size / 1024 / 1024, 0.01).toFixed(2)} MB` : t('file.maxSize')}</small>
      </span>
    </label>
  )
}
