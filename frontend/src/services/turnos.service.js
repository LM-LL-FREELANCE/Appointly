import { request } from '../api/api.js'

export const getProfesionalesSlots = ({ dni, desde, hasta }) => {

  const params = new URLSearchParams({ desde, hasta })

  return request(`/api/profesionales/${dni}/slots?${params}`, { cache: 'no-store' })
}

export const getTurnosProfesional = async ({ dni, desde, hasta }) => {

  const params = new URLSearchParams({ profesional: String(dni) })

  if (desde) params.append('desde', desde)
  if (hasta) params.append('hasta', hasta)

  return request(`/api/turnos?${params}`)
}


export const createNewTurno = async ({ turno }) => {

  return await request('/api/turnos', { method: 'POST', body: JSON.stringify(turno) })
}