import { request } from './api.js'

export const getTurnosClienteByDni = ({ dni, estado }) => {
  return request(`/api/clientes/${dni}/turnos?estado=${estado}`)
}

export const getTurnoById = (id_turno) => {
  return request(`/api/turnos/${id_turno}`)
}

export const cancelTurnoById = ({ id, motivo }) => {
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

export const getTurnosMes = ({ dni }) => {
  return request(`/api/clientes/${dni}/mes`)
}

export const getClienteByDni = ({ dni }) => {
  return request(`/api/clientes/${dni}`)
}

export const updateByDni = ({ dni, data }) => {
  return request(`/api/clientes/${dni}/actualizar`, { method: "PATCH", body: JSON.stringify(data) })
}

export const deleteAccCliente = ({ dni }) => {
  return request(`/api/clientes/${dni}/delete`, { method: "DELETE" })
}