import { Field } from './Field'

export function LoginForm({ form, onChange, onSubmit, submitting, submitLabel }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <Field label="Tên đăng nhập" value={form.username} onChange={(value) => onChange({ ...form, username: value })} />
      <Field label="Mật khẩu" type="password" value={form.password} onChange={(value) => onChange({ ...form, password: value })} />
      <button className="primary-action" type="submit" disabled={submitting}>
        {submitting ? 'Đang xử lý...' : submitLabel}
      </button>
    </form>
  )
}
