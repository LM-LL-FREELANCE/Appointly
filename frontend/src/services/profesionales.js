const BASE_URL = import.meta.env.VITE_API_URL

export const getFilteredProfesional = async ({ especialidad, obraSocial } = {}) => {
  const params = new URLSearchParams()
  if (especialidad) params.append('especialidad', especialidad)
  if (obraSocial) params.append('obrasocial', obraSocial)

  const query = params.toString()
  const url = query
    ? `${BASE_URL}/api/profesionales?${query}`
    : `${BASE_URL}/api/profesionales`

  const response = await fetch(url)
  if (!response.ok) {
    return []
  }
  const data = await response.json();
  return Array.isArray(data) ? data : []
}
export const getAllEspecialidades = async () => {
  const response = await fetch(`${BASE_URL}/api/especialidades/`)
  const data = await response.json()
  return data
}
export const getAllObraSociales = async () => {
  const response = await fetch(`${BASE_URL}/api/obra-sociales/`)
  const data = await response.json()
  return data
}
export const getProfesionalByDni = async ({ dni }) => {
  const response = await fetch(`${BASE_URL}/api/profesionales/${dni}`)
  const data = await response.json();
  return data
}

// GET /api/profesionales/:dni/horarios
export const getHorariosByDni = async ({ dni, rol }) => {
  return await fetch(`${BASE_URL}/api/profesionales/${dni}/horarios`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-dni': dni,
      'x-user-rol': rol,
    }
  }).then((r) => {
    if (!r.ok) throw new Error('Error al obtener los horarios')
    return r.json()
  })
}

// POST /api/profesionales/:dni/horarios
export const createHorario = async ({ dni, dia_semana, hora_inicio, hora_fin }) => {
  const r = await fetch(`${BASE_URL}/api/profesionales/${dni}/horarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-dni': dni,
      'x-user-rol': 'profesional',
    },
    body: JSON.stringify({ dia_semana, hora_inicio, hora_fin }),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.message || 'Error al crear el horario')
  }
  return r.json()
}

// PUT /api/horarios/:id
export const updateHorario = async ({ id, dia_semana, hora_inicio, hora_fin, dni }) => {
  const r = await fetch(`${BASE_URL}/api/horarios/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-dni': dni,
      'x-user-rol': 'profesional',
    },
    body: JSON.stringify({ dia_semana, hora_inicio, hora_fin }),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.message || 'Error al actualizar el horario')
  }
  return r.json()
}

// DELETE /api/horarios/:id
export const deleteHorario = async ({ id, dni }) => {
  const r = await fetch(`${BASE_URL}/api/horarios/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-user-dni': dni,
      'x-user-rol': 'profesional',
    },
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.message || 'Error al eliminar el horario')
  }
}

//GET /api/turnos?profesionales=&desde=&hasta=&estado=
export const getAgendaByProfesional = async ({ dni_profesional, desde, hasta, estado, rol }) => {
  const params = new URLSearchParams({ profesional: dni_profesional, desde, hasta })
  if (estado) params.append('estado', estado)

  const response = await fetch(`${BASE_URL}/api/turnos?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-user-dni': String(dni_profesional),
      'x-user-rol': rol
    }
  })

  const data = await response.json()
  if (!response.ok) throw { status: response.status, ...data }
  return data
}