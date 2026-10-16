import { request } from './api.js'

export const getProfesionalesSlots = ({ dni, desde, hasta }) => {
  const params = new URLSearchParams({ desde, hasta })

  return request(`/api/profesionales/${dni}/slots?${params}`, { cache: 'no-store' })
}

export const createNewTurno = (turno) => {
  return request('/api/turnos', { method: 'POST', body: JSON.stringify(turno) })
}

// estado: confirmado | en_espera | en_curso | completado | ausente. Cancelling has its own endpoint.
export const cambiarEstadoTurno = ({ id, estado, motivo }) => {
  const body = motivo ? { estado, motivo } : { estado }

  return request(`/api/turnos/${id}/estado`, { method: 'PATCH', body: JSON.stringify(body) })
}

export const getEventosTurno = (id) => {
  return request(`/api/turnos/${id}/eventos`)
}
