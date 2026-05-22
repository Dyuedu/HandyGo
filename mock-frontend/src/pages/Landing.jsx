import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import '../styles/pages/Landing.css'

const features = [
  {
    title: 'Đặt dịch vụ nhanh',
    description: 'Tìm đúng thợ theo nhu cầu và theo dõi tiến trình xử lý trong một giao diện thống nhất.',
  },
  {
    title: 'Quản lý ví an toàn',
    description: 'Theo dõi thanh toán, voucher và thu nhập với luồng xác thực JWT rõ ràng.',
  },
  {
    title: 'Hồ sơ thợ xác minh',
    description: 'Thợ tải chứng chỉ hành nghề để hoàn tất quy trình duyệt hồ sơ.',
  },
]

export function Landing() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return (
    <main className="welcome-page">
      <span className="blur-circle circle-one" aria-hidden="true" />
      <span className="blur-circle circle-two" aria-hidden="true" />
      <span className="blur-circle circle-three" aria-hidden="true" />

      <header className="welcome-header">
        <Link to="/welcome" className="welcome-logo">HG</Link>
        <nav className="welcome-actions" aria-label="Thao tác đăng nhập và đăng ký">
          <Link to="/auth" className="ghost-link">Đăng nhập</Link>
          <Link to="/auth" className="solid-link">Đăng ký</Link>
        </nav>
      </header>

      <section className="hero-section">
        <p className="landing-eyebrow">Dịch vụ cao cấp HomeGo</p>
        <h1>Kết nối khách hàng với thợ uy tín trong vài thao tác</h1>
        <p>
          Một nền tảng hiện đại cho đặt lịch, trò chuyện, thanh toán và quản lý hồ sơ thợ đã xác minh.
        </p>
        <div className="hero-actions">
          <Link to="/auth" className="cta-float">Trải nghiệm ngay</Link>
          <Link to="/auth" className="secondary-link">Tôi đã có tài khoản</Link>
        </div>
      </section>

      <section className="feature-grid" aria-label="Tính năng">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <span aria-hidden="true" />
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
