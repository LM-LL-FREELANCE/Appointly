import { request } from './api.js'

export const getSolicitudes = () => request('/api/solicitudes')

export const resolverSolicitud = ({ dni, role, accion }) =>
  request(`/api/solicitudes/${dni}/${role}`, { method: 'PATCH', body: JSON.stringify({ accion }) })

export const getInvitaciones = () => request('/api/invitaciones')

export const crearInvitacion = ({ dni, correo }) =>
  request('/api/invitaciones', { method: 'POST', body: JSON.stringify({ dni, correo }) })

export const revocarInvitacion = ({ id }) => request(`/api/invitaciones/${id}`, { method: 'DELETE' })
