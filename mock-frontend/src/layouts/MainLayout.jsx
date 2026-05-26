import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNotification } from '../context/NotificationContext'
import { AppIcon } from '../components/AppIcon'
import NotificationBell from '../components/NotificationBell'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useLanguage } from '../i18n/LanguageContext'
import '../styles/layouts/MainLayout.css'

const customerNav = [
  { path: '/app/home', icon: 'map', labelKey: 'nav.map' },
  { path: '/app/activity', icon: 'activity', labelKey: 'nav.activity' },
  { path: '/app/chat', icon: 'chat', labelKey: 'nav.chat' },
  { path: '/app/profile', icon: 'profile', labelKey: 'nav.profile' },
]

const technicianNav = [
  { path: '/app/home', icon: 'briefcase', labelKey: 'nav.map' },
  { path: '/app/activity', icon: 'activity', labelKey: 'nav.activity' },
  { path: '/app/chat', icon: 'chat', labelKey: 'nav.chat' },
  { path: '/app/wallet', icon: 'wallet', labelKey: 'nav.wallet' },
  { path: '/app/subscription', icon: 'crown', labelKey: 'nav.subscription' },
  { path: '/app/profile', icon: 'profile', labelKey: 'nav.profile' },
]

const adminNav = [
  { path: '/app/admin/workers', icon: 'users', labelKey: 'nav.workers' },
  { path: '/app/admin/catalog', icon: 'catalog', labelKey: 'nav.catalog' },
]

const sectionNames = {
  '/app/home': 'section.home',
  '/app/activity': 'section.activity',
  '/app/chat': 'section.chat',
  '/app/wallet': 'section.wallet',
  '/app/subscription': 'section.subscription',
  '/app/profile': 'section.profile',
  '/app/admin/workers': 'section.adminWorkers',
  '/app/admin/catalog': 'section.adminCatalog',
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
  const { notifications } = useNotification()
  const { t } = useLanguage()
  const location = useLocation()
  const navigation = mode === 'ADMIN' ? adminNav : mode === 'TECHNICIAN' ? technicianNav : customerNav
  const activeSection = t(sectionNames[location.pathname] || 'section.dashboard')


  return (
    <div className="main-layout">
      <aside className="main-sidebar" aria-label={t('common.homegoDashboard')}>
        <NavLink to="/app/home" className="main-logo" aria-label={t('common.homegoDashboard')}>HG</NavLink>
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const isChat = item.path === '/app/chat';
            const unreadChatCount = isChat 
              ? notifications.filter(n => !n.isRead && n.type === 'MESSAGE_NEW').length 
              : 0;

            return (
              <NavLink key={item.path} to={item.path} className="sidebar-link" style={{ position: 'relative' }}>
                <span className="sidebar-icon" aria-hidden="true">
                  <AppIcon name={item.icon} size={23} />
                </span>
                <span>{t(item.labelKey)}</span>
                {isChat && unreadChatCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <section className="main-content">
        <header className="main-header">
          <div>
            <strong>HomeGo</strong>
            <span>{activeSection} · {roleLabels[mode] ? t(roleLabels[mode]) : mode}</span>
          </div>
          <div className="header-tools">
            <NotificationBell />
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
