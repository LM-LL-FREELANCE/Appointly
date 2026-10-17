import { useMutation, useQuery } from '@tanstack/react-query'
import { aceptarInvitacion, validarInvitacion } from '../api/invitaciones.js'

export function useValidarInvitacion(token) {
  return useQuery({
    queryKey: ['invitacion', token],
    queryFn: () => validarInvitacion(token),
    enabled: !!token,
    retry: false,
    // Re-validating on focus could flip a valid link to "used" mid-form.
    refetchOnWindowFocus: false,
  })
}

export function useAceptarInvitacion() {
  return useMutation({
    mutationFn: aceptarInvitacion,
    meta: { silent: true },
  })
}
