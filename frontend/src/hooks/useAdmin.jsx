import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  crearInvitacion, getInvitaciones, revocarInvitacion,
} from '../api/admin.js'

const INVITACIONES_KEY = ['admin', 'invitaciones']

export const useInvitaciones = () => useQuery({ queryKey: INVITACIONES_KEY, queryFn: getInvitaciones })

export function useCrearInvitacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearInvitacion,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITACIONES_KEY }),
  })
}

export function useRevocarInvitacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: revocarInvitacion,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITACIONES_KEY }),
  })
}
