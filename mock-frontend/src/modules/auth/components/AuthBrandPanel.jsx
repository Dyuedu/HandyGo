import { authHighlights } from '../pages/authContent'
import '../../../styles/modules/auth/components/AuthBrandPanel.css'

export function AuthBrandPanel() {
  return (
    <div className="brand-panel">
      <div className="brand-mark">M</div>
      <div className="brand-copy">
        <p className="eyebrow">Dịch vụ HomeGo</p>
        <h1>Trung tâm tài khoản</h1>
        <p>Truy cập tài khoản khách hàng hoặc đăng ký hồ sơ thợ với chứng chỉ hành nghề.</p>
      </div>
      <div className="brand-stats" aria-label="Điểm nổi bật của xác thực">
        {authHighlights.map((highlight) => (
          <div key={highlight.title}>
            <strong>{highlight.title}</strong>
            <span>{highlight.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
