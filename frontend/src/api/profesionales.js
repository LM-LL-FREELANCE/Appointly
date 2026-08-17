import { request } from "./api.js"

export const getFilteredProfesional = ({ especialidad, obraSocial }) => {
  const params = new URLSearchParams()

  if (especialidad) params.append('especialidad', especialidad)
  if (obraSocial) params.append('obrasocial', obraSocial)

  const url = params.toString() ? `/api/profesionales?${params}` : `/api/profesionales`

  return request(url)
}

export const getAllEspecialidades = () => {
  return request(`/api/especialidades/`)
}

export const getAllObraSociales = () => {
  return request(`/api/obra-sociales/`)
}

// POST /api/auth/registro-profesional
export const registerProfesional = (data) => {
  return request('/api/auth/registro-profesional', { method: 'POST', body: JSON.stringify(data) })
}

export const getProfesionalByDni = async ({ dni }) => {
  return request(`/api/profesionales/${dni}`)
}

// GET /api/profesionales/:dni/horarios
export const getHorariosByDni = ({ dni }) => {
  return request(`/api/profesionales/${dni}/horarios`)
}

// POST /api/profesionales/:dni/horarios
export const createHorario = ({ dni, dia_semana, hora_inicio, hora_fin }) => {
  return request(`/api/profesionales/${dni}/horarios`, { method: 'POST', body: JSON.stringify({ dia_semana, hora_inicio, hora_fin }) })
}

// PUT /api/horarios/:id
export const updateHorario = ({ id, dia_semana, hora_inicio, hora_fin }) => {
  return request(`/api/horarios/${id}`, { method: 'PUT', body: JSON.stringify({ dia_semana, hora_inicio, hora_fin }) })
}

// DELETE /api/horarios/:id
export const deleteHorario = ({ id }) => {
  return request(`/api/horarios/${id}`, { method: 'DELETE' })
}

//GET /api/turnos?profesionales=&desde=&hasta=&estado=
//ex: getAgendaByProfesional
export const getTurnosByProfesional = ({ dni_profesional, desde, hasta, estado }) => {
  const params = new URLSearchParams({ profesional: dni_profesional, desde: desde })

  if (hasta) params.append('hasta', hasta)
  if (estado) params.append('estado', estado)

  return request(`/api/turnos?${params}`)
}

export const updateByDni = ({ dni, data }) => {
  return request(`/api/profesionales/${dni}/actualizar`, { method: "PATCH", body: JSON.stringify(data) })
}

export const deleteAccProfesional = ({ dni }) => {
  return request(`/api/profesionales/${dni}`, { method: "DELETE" })
}