import { useAuth } from '../hooks/useAuth.js'
import { Navigate, Outlet } from 'react-router-dom'
import { Loader } from '@mantine/core'

export function ProtectedRoute({ roles, loginPath = '/login' }) {
  const { user, isAuthLoading } = useAuth()

  if (isAuthLoading) return <Loader />

  if (!user) return <Navigate to={loginPath} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return <Outlet />
}