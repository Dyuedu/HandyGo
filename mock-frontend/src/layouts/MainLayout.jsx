import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AppIcon } from '../components/AppIcon'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useLanguage } from '../i18n/LanguageContext'
import '../styles/layouts/MainLayout.css'

const customerNav = [
  { path: '/app/home', icon: 'map', label: 'Bản đồ' },
  { path: '/app/job-posts/manage', icon: 'briefcase', label: 'Công việc của tôi' },
  { path: '/app/activity', icon: 'activity', label: 'Hoạt động' },
  { path: '/app/chat', icon: 'chat', label: 'Tin nhắn' },
  { path: '/app/profile', icon: 'profile', label: 'Hồ sơ' },
]

const technicianNav = [
  { path: '/app/home', icon: 'map', label: 'Bản đồ' },
  { path: '/app/job-posts/discover', icon: 'briefcase', label: 'Khám phá công việc' },
  { path: '/app/activity', icon: 'activity', label: 'Hoạt động' },
  { path: '/app/chat', icon: 'chat', label: 'Tin nhắn' },
  { path: '/app/wallet', icon: 'wallet', label: 'Ví xu' },
  { path: '/app/subscription', icon: 'crown', label: 'Gói cước' },
  { path: '/app/profile', icon: 'profile', label: 'Hồ sơ' },
]

const adminNav = [
  { path: '/app/admin/workers', icon: 'users', labelKey: 'nav.workers' },
  { path: '/app/admin/catalog', icon: 'catalog', labelKey: 'nav.catalog' },
]

const sectionNames = {
  '/app/home': 'Trang chính',
  '/app/job-posts/manage': 'Công việc của tôi',
  '/app/job-posts/discover': 'Khám phá công việc',
  '/app/job-posts': 'Chi tiết công việc',
  '/app/activity': 'Hoạt động',
  '/app/chat': 'Tin nhắn',
  '/app/wallet': 'Ví xu',
  '/app/subscription': 'Gói cước',
  '/app/profile': 'Hồ sơ',
  '/app/admin/workers': 'Quản lý thợ',
  '/app/admin/catalog': 'Gói & Voucher',
}

const roleLabels = {
  ADMIN: 'common.admin',
  TECHNICIAN: 'common.technician',
  CUSTOMER: 'common.customer',
  WORKER: 'common.worker',
  USER: 'common.customer',
}

export function MainLayout() {
  const { mode, session, signOut } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const navigation = mode === 'ADMIN' ? adminNav : mode === 'TECHNICIAN' ? technicianNav : customerNav
  const activeSection = t(sectionNames[location.pathname] || 'section.dashboard')


  return (
    <div className="main-layout">
      <aside className="main-sidebar" aria-label={t('common.homegoDashboard')}>
        <NavLink to="/app/home" className="main-logo" aria-label={t('common.homegoDashboard')}>HG</NavLink>
        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <NavLink key={item.path} to={item.path} className="sidebar-link">
              <span className="sidebar-icon" aria-hidden="true">
                <AppIcon name={item.icon} size={23} />
              </span>
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="main-content">
        <header className="main-header">
          <div>
            <strong>HomeGo</strong>
            <span>{activeSection} · {roleLabels[mode] ? t(roleLabels[mode]) : mode}</span>
          </div>
          <div className="header-tools">
            <LanguageSwitcher />
            <div className="role-switch" aria-label={t('common.role')}>
              <span>{t('common.role')}</span>
              <strong>{roleLabels[session?.role] ? t(roleLabels[session?.role]) : session?.role || t('common.customer')}</strong>
            </div>
            <button type="button" onClick={signOut}>{t('common.signOut')}</button>
          </div>
        </header>

        <main className="main-scroll">
          <Outlet />
        </main>
      </section>
    </div>
  )
}
