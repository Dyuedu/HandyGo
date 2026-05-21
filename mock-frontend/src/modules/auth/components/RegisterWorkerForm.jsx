import { Field } from './Field'
import { FileField } from './FileField'

export function RegisterWorkerForm({ form, onChange, onSubmit, submitting, submitLabel }) {
  return (
    <form className="auth-form two-column" onSubmit={onSubmit}>
      <Field label="Tên đăng nhập" value={form.username} onChange={(value) => onChange({ ...form, username: value })} />
      <Field label="Mật khẩu" type="password" value={form.password} onChange={(value) => onChange({ ...form, password: value })} />
      <Field label="Họ tên" value={form.fullName} onChange={(value) => onChange({ ...form, fullName: value })} />
      <Field label="Số điện thoại" value={form.phone} onChange={(value) => onChange({ ...form, phone: value })} />
      <Field label="Loại công việc" value={form.jobType} onChange={(value) => onChange({ ...form, jobType: value })} />
      <FileField
        label="Chứng chỉ hành nghề"
        file={form.professionalCertificate}
        onChange={(file) => onChange({ ...form, professionalCertificate: file })}
      />
      <button className="primary-action span-all" type="submit" disabled={submitting}>
        {submitting ? 'Đang xử lý...' : submitLabel}
      </button>
    </form>
  )
}
