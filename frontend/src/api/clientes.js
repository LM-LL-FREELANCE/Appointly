import { request } from './api.js'

export const getTurnosClienteByDni = ({ dni, estado }) => {
  return request(`/api/clientes/${dni}/turnos?estado=${estado}`)
}

export const getTurnoById = (id_turno) => {
  return request(`/api/turnos/${id_turno}`)
}

export const cancelTurnoById = (arg1, ...rest) => {
  const isObject = typeof arg1 === 'object' && arg1 !== null
  const id = isObject ? (arg1.id ?? arg1.id_turno) : arg1
  const motivo = isObject
    ? (arg1.motivo ?? '')
    : (typeof rest[2] === 'string' ? rest[2] : (typeof rest[0] === 'string' ? rest[0] : ''))

  return request(`/api/turnos/${id}/cancelacion`, {
    method: 'POST',
    body: JSON.stringify(motivo ? { motivo } : {}),
  })
}

export const createAccount = (data) => {
  return request('/api/auth/registro', { method: 'POST', body: JSON.stringify(data) })
}

export const getTurnosMes = ({ dni }) => {
  return request(`/api/clientes/${dni}/mes`)
}

export const getClienteByDni = ({ dni }) => {
  return request(`/api/clientes/${dni}`)
}

export const updateByDni = ({ dni, data }) => {
  return request(`/api/clientes/${dni}/actualizar`, { method: 'PATCH', body: JSON.stringify(data) })
}

export const deleteAccCliente = ({ dni }) => {
  return request(`/api/clientes/${dni}`, { method: 'DELETE' })
}
