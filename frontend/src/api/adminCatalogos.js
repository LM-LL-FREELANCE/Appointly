import { request } from './api.js'

// WS2 — ABM de catálogos maestros (PLAN_ADMIN.md §8.7 E1–E10).
// La lectura pública devuelve nombres con alias distintos por recurso
// (`especialidad` vs `obra_social`); acá se normalizan a `nombre` para que la
// tabla sea una sola.

const BASE = {
  'especialidades': '/api/especialidades',
  'obras-sociales': '/api/obra-sociales',
}

const normalizar = (recurso, item) => ({
  id: item.id,
  nombre: recurso === 'especialidades' ? item.especialidad : item.obra_social,
  activo: Boolean(item.activo),
  profesionales: Number(item.profesionales ?? 0),
})

const payloadNombre = (recurso, nombre) => (
  recurso === 'especialidades' ? { tipo: nombre } : { nombre_obra_social: nombre }
)

export const getCatalogo = async (recurso) => {
  const items = await request(`${BASE[recurso]}/`)
  return items.map((item) => normalizar(recurso, item))
}

export const crearCatalogoItem = ({ recurso, nombre }) => request(`${BASE[recurso]}/`, {
  method: 'POST',
  body: JSON.stringify(payloadNombre(recurso, nombre)),
})

export const editarCatalogoItem = ({ recurso, id, nombre }) => request(`${BASE[recurso]}/${id}`, {
  method: 'PUT',
  body: JSON.stringify(payloadNombre(recurso, nombre)),
})

export const cambiarEstadoCatalogoItem = ({ recurso, id, activo }) => request(`${BASE[recurso]}/${id}/estado`, {
  method: 'PATCH',
  body: JSON.stringify({ activo }),
})

export const getProfesionalesCatalogo = ({ recurso, id }) =>
  request(`${BASE[recurso]}/${id}/profesionales`)
