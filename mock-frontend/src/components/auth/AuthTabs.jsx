import './AuthTabs.css'

const tabs = [
  { value: 'login', label: 'Đăng nhập' },
  { value: 'user', label: 'Khách hàng' },
  { value: 'worker', label: 'Thợ' },
]

export function AuthTabs({ mode, onChange }) {
  return (
    <div className="tabs" role="tablist" aria-label="Auth modes">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={mode === tab.value ? 'active' : ''}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
