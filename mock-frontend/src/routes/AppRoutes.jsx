import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { BookingActivityPage } from '../modules/booking/pages/BookingActivityPage'
import { BookingDetailPage } from '../modules/booking/pages/BookingDetailPage'
import { AccessDenied } from '../pages/AccessDenied'
import { Auth } from '../pages/Auth'
import { DashboardHome } from '../pages/DashboardHome'
import { Landing } from '../pages/Landing'
import { PrivateRoute } from './PrivateRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route path="/welcome" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/app" element={<Navigate to="/app/home" replace />} />
          <Route path="/app/home" element={<DashboardHome />} />
          <Route path="/app/activity" element={<BookingActivityPage />} />
          <Route path="/app/bookings/:bookingId" element={<BookingDetailPage />} />
          <Route path="/app/chat" element={<DashboardHome section="Chat" />} />
          <Route path="/app/wallet" element={<DashboardHome section="Wallet" />} />
          <Route path="/app/profile" element={<DashboardHome section="Profile" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  )
}
