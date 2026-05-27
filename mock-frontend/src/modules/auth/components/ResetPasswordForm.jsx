import { Field } from './Field'
import { useLanguage } from '../../../i18n/LanguageContext'

export function ResetPasswordForm({ form, onChange, onSubmit, submitting, submitLabel, onBackToLogin }) {
  const { t } = useLanguage()

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <Field label={t('form.newPassword')} type="password" value={form.newPassword} onChange={(value) => onChange({ ...form, newPassword: value })} />
      <button className="primary-action" type="submit" disabled={submitting}>
        {submitting ? t('common.processing') : submitLabel}
      </button>
      <button className="secondary" type="button" onClick={onBackToLogin} disabled={submitting}>
        {t('auth.backToLogin')}
      </button>
    </form>
  )
}
