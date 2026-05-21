import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import '../styles/layouts/MainLayout.css'

const customerNav = [
  { path: '/app/home', icon: '⌂', label: 'Map' },
  { path: '/app/activity', icon: '◷', label: 'Activity' },
  { path: '/app/chat', icon: '◌', label: 'Chat' },
  { path: '/app/profile', icon: '◎', label: 'Profile' },
]

const technicianNav = [
  { path: '/app/home', icon: '▣', label: 'Jobs' },
  { path: '/app/activity', icon: '◷', label: 'Activity' },
  { path: '/app/chat', icon: '◌', label: 'Chat' },
  { path: '/app/wallet', icon: '◈', label: 'Wallet' },
  { path: '/app/profile', icon: '◎', label: 'Profile' },
]

const adminNav = [
  { path: '/app/admin/workers', icon: '👥', label: 'Workers' },
]

const sectionNames = {
  '/app/home': 'Home',
  '/app/activity': 'Activity',
  '/app/chat': 'Chat',
  '/app/wallet': 'Wallet',
  '/app/profile': 'Profile',
  '/app/admin/workers': 'Workers Management',
}

export function MainLayout() {
  const { mode, session, signOut } = useAuth()
  const location = useLocation()
  const navigation = mode === 'ADMIN' ? adminNav : mode === 'TECHNICIAN' ? technicianNav : customerNav
  const activeSection = sectionNames[location.pathname] || 'Dashboard'


  return (
    <div className="main-layout">
      <aside className="main-sidebar" aria-label="Main navigation">
        <NavLink to="/app/home" className="main-logo" aria-label="HomeGo dashboard">HG</NavLink>
        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <NavLink key={item.path} to={item.path} className="sidebar-link">
              <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="main-content">
        <header className="main-header">
          <div>
            <strong>HomeGo</strong>
            <span>{activeSection} · {mode === 'ADMIN' ? 'Admin' : mode === 'TECHNICIAN' ? 'Worker' : 'User'}</span>
          </div>
          <div className="header-tools">
            <div className="role-switch" aria-label="Account role">
              <span>Mode</span>
              <strong>{session?.role || 'USER'}</strong>
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
