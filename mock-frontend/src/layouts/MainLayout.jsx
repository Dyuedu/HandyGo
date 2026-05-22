import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AppIcon } from '../components/AppIcon'
import '../styles/layouts/MainLayout.css'

const customerNav = [
  { path: '/app/home', icon: 'map', label: 'Bản đồ' },
  { path: '/app/activity', icon: 'activity', label: 'Hoạt động' },
  { path: '/app/chat', icon: 'chat', label: 'Tin nhắn' },
  { path: '/app/profile', icon: 'profile', label: 'Hồ sơ' },
]

const technicianNav = [
  { path: '/app/home', icon: 'briefcase', label: 'Công việc' },
  { path: '/app/activity', icon: 'activity', label: 'Hoạt động' },
  { path: '/app/chat', icon: 'chat', label: 'Tin nhắn' },
  { path: '/app/wallet', icon: 'wallet', label: 'Ví' },
  { path: '/app/subscription', icon: 'crown', label: 'Gói cước' },
  { path: '/app/profile', icon: 'profile', label: 'Hồ sơ' },
]

const adminNav = [
  { path: '/app/admin/workers', icon: 'users', label: 'Thợ' },
  { path: '/app/admin/catalog', icon: 'catalog', label: 'Gói & Voucher' },
]

const sectionNames = {
  '/app/home': 'Trang chính',
  '/app/activity': 'Hoạt động',
  '/app/chat': 'Tin nhắn',
  '/app/wallet': 'Ví',
  '/app/subscription': 'Gói cước',
  '/app/profile': 'Hồ sơ',
  '/app/admin/workers': 'Quản lý thợ',
  '/app/admin/catalog': 'Gói & Voucher',
}

const roleLabels = {
  ADMIN: 'Quản trị viên',
  TECHNICIAN: 'Thợ',
  CUSTOMER: 'Khách hàng',
  WORKER: 'Thợ',
  USER: 'Khách hàng',
}

export function MainLayout() {
  const { mode, session, signOut } = useAuth()
  const location = useLocation()
  const navigation = mode === 'ADMIN' ? adminNav : mode === 'TECHNICIAN' ? technicianNav : customerNav
  const activeSection = sectionNames[location.pathname] || 'Bảng điều khiển'


  return (
    <div className="main-layout">
      <aside className="main-sidebar" aria-label="Điều hướng chính">
        <NavLink to="/app/home" className="main-logo" aria-label="Bảng điều khiển HomeGo">HG</NavLink>
        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <NavLink key={item.path} to={item.path} className="sidebar-link">
              <span className="sidebar-icon" aria-hidden="true">
                <AppIcon name={item.icon} size={23} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="main-content">
        <header className="main-header">
          <div>
            <strong>HomeGo</strong>
            <span>{activeSection} · {roleLabels[mode] || mode}</span>
          </div>
          <div className="header-tools">
            <div className="role-switch" aria-label="Vai trò tài khoản">
              <span>Vai trò</span>
              <strong>{roleLabels[session?.role] || session?.role || 'Khách hàng'}</strong>
            </div>
            <button type="button" onClick={signOut}>Đăng xuất</button>
          </div>
        </header>

        <main className="main-scroll">
          <Outlet />
        </main>
      </section>
    </div>
  )
}
