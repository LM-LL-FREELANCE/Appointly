import { useMutation } from '@tanstack/react-query'
import { registrarCuenta } from '../api/api.js'
import { aceptarInvitacion } from '../api/invitaciones.js'
import useRegistroNotifications from './useRegistroNotifications.jsx'

/**
 * Shared submit logic for every registration screen.
 * - cliente: POST /api/auth/registro.
 * - profesional / admin: accepts the invitation `token`.
 * The screen only decides what happens on success.
 */
export default function useRegistroFlow({ role = 'cliente', token }) {
  const { showLoading, showError } = useRegistroNotifications()

  const mutation = useMutation({
    mutationFn: (payload) => (token
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
