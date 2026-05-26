import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { BookingActivityPage } from '../modules/booking/pages/BookingActivityPage'
import { BookingDetailPage } from '../modules/booking/pages/BookingDetailPage'
import { JobPostManagement, JobPostDetail, JobPostDiscovery, JobPostDiscoveryMap } from '../modules/jobpost'
import { AccessDenied } from '../pages/AccessDenied'
import { Auth } from '../pages/Auth'
import { UnverifiedPage } from '../pages/UnverifiedPage'
import { DashboardHome } from '../pages/DashboardHome'
import { ProfilePage } from '../pages/ProfilePage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { WorkerProfile } from '../pages/WorkerProfile'
import { Landing } from '../pages/Landing'
import { AdminDashboard } from '../pages/AdminDashboard'
import { AdminWorkerDetail } from '../pages/AdminWorkerDetail'
import { AdminCatalogPage } from '../pages/AdminCatalogPage'
import { PrivateRoute } from './PrivateRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route path="/welcome" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/unverified" element={<UnverifiedPage />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/app" element={<Navigate to="/app/home" replace />} />
          <Route path="/app/home" element={<DashboardHome />} />
          <Route path="/app/job-posts/manage" element={<JobPostManagement />} />
          <Route path="/app/job-posts/discover" element={<JobPostDiscovery />} />
          <Route path="/app/job-posts/map" element={<JobPostDiscoveryMap />} />
          <Route path="/app/job-posts/:jobPostId" element={<JobPostDetail />} />
          <Route path="/app/activity" element={<BookingActivityPage />} />
          <Route path="/app/bookings/:bookingId" element={<BookingDetailPage />} />
          <Route path="/app/chat" element={<DashboardHome section="Chat" />} />
          <Route path="/app/wallet" element={<DashboardHome section="Wallet" />} />
          <Route path="/app/subscription" element={<DashboardHome section="Subscription" />} />
          <Route path="/app/profile" element={<ProfilePage />} />
          <Route path="/app/notifications" element={<NotificationsPage />} />
          <Route path="/app/worker/:id" element={<WorkerProfile />} />
          <Route path="/app/admin/workers" element={<AdminDashboard />} />
          <Route path="/app/admin/workers/:id" element={<AdminWorkerDetail />} />
          <Route path="/app/admin/catalog" element={<AdminCatalogPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  )
}
