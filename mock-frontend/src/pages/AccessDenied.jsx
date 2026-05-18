import { Link } from 'react-router-dom'

export function AccessDenied() {
  return (
    <main className="landing-page">
      <section>
        <p className="landing-eyebrow">403</p>
        <h1>Không có quyền truy cập</h1>
        <p>Tài khoản hiện tại không được phép mở khu vực này.</p>
        <Link to="/">Về trang chủ</Link>
      </section>
    </main>
  )
}
