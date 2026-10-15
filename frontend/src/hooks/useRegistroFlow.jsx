import { useMutation } from '@tanstack/react-query'
import { registrarCuenta } from '../api/api.js'
import { aceptarInvitacion } from '../api/invitaciones.js'
import useRegistroNotifications from './useRegistroNotifications.jsx'

/**
 * Shared submit logic for every registration screen.
 * - cliente / profesional: POST /api/auth/registro with the role in the body.
 * - admin: accepts the invitation `token` (the account is created from it).
 * The screen only decides what happens on success.
 */
export default function useRegistroFlow({ role, token }) {
  const { showLoading, showError } = useRegistroNotifications()

  const mutation = useMutation({
    mutationFn: (payload) => (role === 'admin'
      ? aceptarInvitacion({ token, data: payload })
      : registrarCuenta({ ...payload, role })),
    meta: { silent: true },
  })

  const submit = (payload, { onSuccess } = {}) => {
    showLoading()
    mutation.mutate(payload, { onSuccess, onError: showError })
  }

  return { submit, isPending: mutation.isPending, error: mutation.error }
}
