import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  crearInvitacion, getInvitaciones, getSolicitudes, resolverSolicitud, revocarInvitacion,
} from '../api/admin.js'

const SOLICITUDES_KEY = ['admin', 'solicitudes']
const INVITACIONES_KEY = ['admin', 'invitaciones']

export const useSolicitudes = () => useQuery({ queryKey: SOLICITUDES_KEY, queryFn: getSolicitudes })

export function useResolverSolicitud() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resolverSolicitud,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SOLICITUDES_KEY }),
  })
}

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
