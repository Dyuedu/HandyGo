import { Field } from './Field'
import { useLanguage } from '../../../i18n/LanguageContext'

export function VerifyEmailForm({ form, onChange, onSubmit, submitting, submitLabel }) {
  const { t } = useLanguage()
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <Field 
        label={t('form.email')} 
        type="email" 
        value={form.email} 
        onChange={(value) => onChange({ ...form, email: value })}
        disabled={!!form.isEmailFixed} 
      />
      <Field 
        label={t('form.otp')} 
        value={form.otp} 
        onChange={(value) => onChange({ ...form, otp: value })} 
        maxLength={6}
      />
      <button className="primary-action" type="submit" disabled={submitting}>
        {submitting ? t('common.processing') : submitLabel}
      </button>
    </form>
  )
}
