import { request } from '../api/api.js'

export const getProfesionalesSlots = ({ dni, desde, hasta }) => {
  const params = new URLSearchParams({ desde, hasta })

  return request(`/api/profesionales/${dni}/slots?${params}`, { cache: 'no-store' })
}

export const createNewTurno = (turno) => {
  return request('/api/turnos', { method: 'POST', body: JSON.stringify(turno) })
}