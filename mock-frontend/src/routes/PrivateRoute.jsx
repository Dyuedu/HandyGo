import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function PrivateRoute({ allowedRoles }) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to="/access-denied" replace />
  }

  return <Outlet />
}
