import '../../../styles/modules/auth/components/Field.css'

export function Field({ label, type = 'text', value, onChange, ...rest }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} {...rest} />
    </label>
  )
}
