import { request } from './api.js'

export const getAdminTurnos = ({ desde, hasta, estado, profesional, cliente } = {}) => {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  if (estado) params.set('estado', estado)
  if (profesional) params.set('profesional', String(profesional))
  if (cliente) params.set('cliente', String(cliente).trim())
  const qs = params.toString()
  return request(qs ? `/api/admin/turnos?${qs}` : '/api/admin/turnos')
}

export const cancelarTurnoAdmin = ({ id, motivo }) => {
  return request(`/api/admin/turnos/${id}/cancelacion`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  })
}

export const reasignarTurno = ({ id, dni_profesional, motivo }) => {
  return request(`/api/admin/turnos/${id}/reasignacion`, {
    method: 'POST',
    body: JSON.stringify({ dni_profesional, motivo }),
  })
}

export const completarTurnoAdmin = ({ id, motivo }) => {
  return request(`/api/admin/turnos/${id}/completacion`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  })
}

export const ausenteTurnoAdmin = ({ id, motivo }) => {
  return request(`/api/admin/turnos/${id}/ausencia`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  })
}

export const getBloqueos = ({ desde, hasta, profesional } = {}) => {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  if (profesional) params.set('profesional', String(profesional))
  const qs = params.toString()
  return request(qs ? `/api/admin/bloqueos?${qs}` : '/api/admin/bloqueos')
}

export const crearBloqueo = ({ fechas, hora_inicio, hora_fin, dni_profesional, motivo }) => {
  return request('/api/admin/bloqueos', {
    method: 'POST',
    body: JSON.stringify({ fechas, hora_inicio, hora_fin, dni_profesional, motivo }),
  })
}

export const eliminarBloqueo = (id) => {
  return request(`/api/admin/bloqueos/${id}`, {
    method: 'DELETE',
  })
}
