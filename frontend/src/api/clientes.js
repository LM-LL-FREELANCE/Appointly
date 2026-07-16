import { request } from './api.js'

const BASE_URL = import.meta.env.VITE_API_URL

export const getTurnosClienteByDni = ({ dni, estado }) => {
  /* const responseOld = await fetch(`${BASE_URL}/api/clientes/${dni}/turnos?estado=${estado}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-dni': dni,
      'x-user-rol': rol,
    }
  }).then((r) => {
    if (!r.ok) throw new Error('Error al obtener los turnos del cliente')
    return r.json()
  }) */
  return request(`/api/clientes/${dni}/turnos?estado=${estado}`)
}

export const getTurnoById = (id_turno) => {
  /* return await fetch(`${BASE_URL}/api/turnos/${id_turno}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-dni': dni,
      'x-user-rol': rol,
    }
  }).then((r) => {
    if (!r.ok) throw new Error('Error al obtener el turno')
    return r.json()
  }) */

  return request(`/api/turnos/${id_turno}`)
}

export const cancelTurnoById = (id, motivo) => {
  /* const r = await fetch(`${BASE_URL}/api/turnos/${id}/cancelacion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-dni': requesterDni,
      'x-user-rol': requesterRol,
    },
    // El motivo es opcional (lo usa el profesional al cancelar). El backend
    // lo pasa al email que se le envía al cliente.
    body: JSON.stringify(motivo ? { motivo } : {}),
  }) */
  /* if (!r.ok) {
    const body = await r.json().catch(() => ({}))
    const err = new Error(body.message ?? 'Error al cancelar el turno')
    err.status = r.status
    err.code = body.code
    throw err
  }
  return r.json() */

  return request(`/api/turnos/${id}/cancelacion`, { method: 'POST', body: JSON.stringify(motivo ? { motivo } : {}) })
}

export const createAccount = (data) => {
  return request("/api/auth/registro", { method: 'POST', body: JSON.stringify(data) })
}

/*export const getTurnosActivos = async ({ dni }) => {
  const response = await fetch(`${BASE_URL}/api/clientes/${dni}/turnos/activos`)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw body
  }
  return response.json()

  return request(`/api/clientes`)
}*/

export const getTurnosMes = async (dni) => {
  const response = await fetch(`${BASE_URL}/api/clientes/${dni}/mes`)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw body
  }

  return response.json()
}