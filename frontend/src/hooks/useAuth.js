import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { getMe, login as loginRequest, logout as logoutRequest } from '../api/api.js'

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
    onSuccess: () => queryClient.setQueryData(ME_KEY, null),
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