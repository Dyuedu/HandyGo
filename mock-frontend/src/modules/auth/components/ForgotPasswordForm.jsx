import { Field } from './Field'
import { useLanguage } from '../../../i18n/LanguageContext'

export function ForgotPasswordForm({ form, onChange, onSubmit, submitting, submitLabel, onBackToLogin }) {
  const { t } = useLanguage()

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <Field label={t('form.email')} type="email" value={form.email} onChange={(value) => onChange({ ...form, email: value })} />
      <button className="primary-action" type="submit" disabled={submitting}>
        {submitting ? t('common.processing') : submitLabel}
      </button>
      <button className="secondary" type="button" onClick={onBackToLogin} disabled={submitting}>
        {t('auth.backToLogin')}
      </button>
    </form>
  )
}
