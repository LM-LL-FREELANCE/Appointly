import { request } from './api.js'

// WS3 — avisos del centro (PLAN_ADMIN.md §8.2 C3–C7).

export const getAvisosActivos = () => request('/api/avisos/activos')

export const getAvisosAdmin = () => request('/api/admin/avisos')

export const crearAviso = (aviso) => request('/api/admin/avisos', {
  method: 'POST',
  body: JSON.stringify(aviso),
})

export const editarAviso = ({ id, ...aviso }) => request(`/api/admin/avisos/${id}`, {
  method: 'PUT',
  body: JSON.stringify(aviso),
})

export const eliminarAviso = ({ id }) => request(`/api/admin/avisos/${id}`, { method: 'DELETE' })
