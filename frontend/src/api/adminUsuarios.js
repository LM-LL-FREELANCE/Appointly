import { request } from './api.js'

const base = (dni, rol) => `/api/admin/usuarios/${dni}/${rol}`

export const getUsuarios = ({ rol, estado, q } = {}) => {
  const params = new URLSearchParams()

  if (rol) params.append('rol', rol)
  if (estado) params.append('estado', estado)
  if (q) params.append('q', q)

  const query = params.toString()

  return request(`/api/admin/usuarios${query ? `?${query}` : ''}`)
}

export const getUsuario = ({ dni, rol }) => request(base(dni, rol))

export const editarUsuario = ({ dni, rol, data }) =>
  request(base(dni, rol), { method: 'PATCH', body: JSON.stringify(data) })

export const suspenderUsuario = ({ dni, rol }) =>
  request(`${base(dni, rol)}/suspension`, { method: 'POST' })

export const reactivarUsuario = ({ dni, rol }) =>
  request(`${base(dni, rol)}/reactivacion`, { method: 'POST' })

export const darDeBajaUsuario = ({ dni, rol }) =>
  request(base(dni, rol), { method: 'DELETE' })

export const resetPasswordUsuario = ({ dni, rol }) =>
  request(`${base(dni, rol)}/reset-password`, { method: 'POST' })
