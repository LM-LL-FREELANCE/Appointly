import { useAuth } from '../hooks/useAuth.js'
import { Navigate, Outlet } from 'react-router-dom'
import { Loader } from '@mantine/core'
import { LOGIN_BY_ROLE, HOME_BY_ROLE } from '../utils/roles.js'

export function ProtectedRoute({ roles, loginPath = roles?.length === 1 ? LOGIN_BY_ROLE[roles[0]] : LOGIN_BY_ROLE.cliente }) {
  const { user, isAuthLoading } = useAuth()

  if (isAuthLoading) return <Loader />

  if (!user) return <Navigate to={loginPath} replace />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={HOME_BY_ROLE[user.role] ?? '/'} replace />
  }

  return <Outlet />
}