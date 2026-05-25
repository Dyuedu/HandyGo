import { Field } from '../../auth/components/Field'
import { useLanguage } from '../../../i18n/LanguageContext'

export function RegisterUserForm({ form, onChange, onSubmit, submitting, submitLabel }) {
  const { t } = useLanguage()
  return (
    <form className="auth-form two-column" onSubmit={onSubmit}>
      <Field label={t('form.username')} value={form.username} onChange={(value) => onChange({ ...form, username: value })} />
      <Field label={t('form.password')} type="password" value={form.password} onChange={(value) => onChange({ ...form, password: value })} />
      <Field label={t('form.fullName')} value={form.fullName} onChange={(value) => onChange({ ...form, fullName: value })} />
      <Field label={t('form.phone')} value={form.phone} onChange={(value) => onChange({ ...form, phone: value })} />
      <button className="primary-action span-all" type="submit" disabled={submitting}>
        {submitting ? t('common.processing') : submitLabel}
      </button>
    </form>
  )
}
