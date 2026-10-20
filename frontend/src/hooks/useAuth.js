import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  getMe, login as loginRequest, logout as logoutRequest,
  reenviarMfa as reenviarMfaRequest, verificarMfa as verificarMfaRequest,
} from '../api/api.js'
import { LOGIN_BY_ROLE } from '../utils/roles.js'
import { disconnectSocket } from '../socket/client.js'

const ME_KEY = ['auth', 'me']

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading: isAuthLoading } = useQuery({
    queryKey: ME_KEY,
    queryFn: getMe
  })

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    // El login de admin devuelve `{ mfa_required, challenge, expira_en }` y NO
    // emite cookie: ese objeto no es el usuario. `me` se llena recién al
    // verificar el código (PLAN_ADMIN.md §10.6).
    onSuccess: (data) => {
      if (!data?.mfa_required) queryClient.setQueryData(ME_KEY, data)
    },
  })

  const verificarMfaMutation = useMutation({
    mutationFn: verificarMfaRequest,
    onSuccess: (data) => queryClient.setQueryData(ME_KEY, data),
  })

  const reenviarMfaMutation = useMutation({
    mutationFn: reenviarMfaRequest,
  })

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    // Full navigation (not router navigate): it lands on the login of the role that
    // just signed out without racing the route guards, and drops all cached user data.
    onSuccess: () => {
      disconnectSocket()
      const role = queryClient.getQueryData(ME_KEY)?.role
      window.location.replace(LOGIN_BY_ROLE[role] ?? LOGIN_BY_ROLE.cliente)
    },
  })

  return {
    user,
    isAuthLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    resetLogin: loginMutation.reset,
    verificarMfa: verificarMfaMutation.mutateAsync,
    isVerifyingMfa: verificarMfaMutation.isPending,
    reenviarMfa: reenviarMfaMutation.mutateAsync,
    isResendingMfa: reenviarMfaMutation.isPending,
    logout: logoutMutation.mutate,
  }
}
