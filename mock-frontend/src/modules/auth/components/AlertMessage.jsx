import './AlertMessage.css'

export function AlertMessage({ type, children }) {
  if (!children) return null

  return <div className={`notice ${type}`}>{children}</div>
}
