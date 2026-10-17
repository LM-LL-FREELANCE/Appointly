import { request } from './api.js'

export const getInvitaciones = () => request('/api/invitaciones')

export const crearInvitacion = ({ dni, correo, role }) =>
  request('/api/invitaciones', { method: 'POST', body: JSON.stringify({ dni, correo, role }) })

export const revocarInvitacion = ({ id }) => request(`/api/invitaciones/${id}`, { method: 'DELETE' })
