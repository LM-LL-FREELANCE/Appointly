import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { getMe, login as loginRequest, logout as logoutRequest } from '../api/api.js'
import { LOGIN_BY_ROLE } from '../utils/roles.js'

const ME_KEY = ['auth', 'me']

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading: isAuthLoading } = useQuery({
    queryKey: ME_KEY,
    queryFn: getMe
  })

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => queryClient.setQueryData(ME_KEY, data),
  })

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    // Full navigation (not router navigate): it lands on the login of the role that
    // just signed out without racing the route guards, and drops all cached user data.
    onSuccess: () => {
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
    logout: logoutMutation.mutate,
  }
}