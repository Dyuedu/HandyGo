import '../../../styles/modules/auth/components/Field.css'

export function FileField({ label, file, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="upload-box">
        <input type="file" accept="application/pdf,image/*" onChange={(event) => onChange(event.target.files?.[0] || null)} />
        <strong>{file ? file.name : 'Chọn file PDF hoặc ảnh'}</strong>
        <small>{file ? `${Math.max(file.size / 1024 / 1024, 0.01).toFixed(2)} MB` : 'Tối đa 10MB'}</small>
      </span>
    </label>
  )
}
