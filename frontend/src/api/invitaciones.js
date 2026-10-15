import { request } from './api.js'

export const validarInvitacion = (token) =>
  request(`/api/invitaciones/validar/${encodeURIComponent(token)}`)

export const aceptarInvitacion = ({ token, data }) =>
  request(`/api/auth/registro/invitacion/${encodeURIComponent(token)}`, { method: 'POST', body: JSON.stringify(data) })
