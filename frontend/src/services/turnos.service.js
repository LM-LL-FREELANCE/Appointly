const BASE_URL = import.meta.env.VITE_API_URL
import { request } from '../api/api.js'

/* export const getProfesionalesSlots = async ({ dni, desde, hasta }) => {
  const params = new URLSearchParams({ desde, hasta })
  const response = await fetch(`${BASE_URL}/api/profesionales/${dni}/slots?${params}`, {
    cache: 'no-store'
  })

  const data = await response.json()
  if (!response.ok) {
    throw { status: response.status, ...data };
  }

  return data
} */

export const getProfesionalesSlots = ({ dni, desde, hasta }) => {
  const params = new URLSearchParams({ desde, hasta })
  return request(`/profesionales/${dni}/slots?${params}`, { cache: 'no-store' })
}

/* export const getTurnosProfesional = async ({ dni, desde, hasta } = {}) => {
  const params = new URLSearchParams({ profesional: String(dni) })
  if (desde) params.append('desde', desde)
  if (hasta) params.append('hasta', hasta)

  const r = await fetch(`${BASE_URL}/api/turnos?${params}`, {
    headers: {
      'x-user-dni': String(dni),
      'x-user-rol': 'profesional',
    },
  })
  if (!r.ok) throw new Error('Error al obtener los turnos')
  return r.json()
} */

export const getTurnosProfesional = async ({ dni, desde, hasta }) => {
  const params = new URLSearchParams({ profesional: String(dni) })
  if (desde) params.append('desde', desde)
  if (hasta) params.append('hasta', hasta)

  return request(`/profesionales/${dni}/slots?${params}`)
}


export const createNewTurno = async ({ userDni, userRol, ...turno }) => {
  const response = await fetch(`${BASE_URL}/api/turnos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-dni': String(userDni),
      'x-user-rol': userRol,
    },
    body: JSON.stringify(turno)
  })
  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, ...data };
  }

  return data;
}