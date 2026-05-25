import { Field } from '../../auth/components/Field'
import { FileField } from './FileField'
import { useLanguage } from '../../../i18n/LanguageContext'

export function RegisterWorkerForm({ form, onChange, onSubmit, submitting, submitLabel }) {
  const { t } = useLanguage()
  return (
    <form className="auth-form two-column" onSubmit={onSubmit}>
      <Field label={t('form.username')} value={form.username} onChange={(value) => onChange({ ...form, username: value })} />
      <Field label={t('form.password')} type="password" value={form.password} onChange={(value) => onChange({ ...form, password: value })} />
      <Field label={t('form.fullName')} value={form.fullName} onChange={(value) => onChange({ ...form, fullName: value })} />
      <Field label={t('form.phone')} value={form.phone} onChange={(value) => onChange({ ...form, phone: value })} />
      <Field label={t('form.jobType')} value={form.jobType} onChange={(value) => onChange({ ...form, jobType: value })} />
      <FileField
        label={t('form.certificate')}
        file={form.professionalCertificate}
        onChange={(file) => onChange({ ...form, professionalCertificate: file })}
      />
      <button className="primary-action span-all" type="submit" disabled={submitting}>
        {submitting ? t('common.processing') : submitLabel}
      </button>
    </form>
  )
}
