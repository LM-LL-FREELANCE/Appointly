const BASE_URL = import.meta.env.VITE_API_URL

export const getTurnosClienteByDni = async ({ dni, rol, estado }) => {
  return await fetch(`${BASE_URL}/api/clientes/${dni}/turnos?estado=${estado}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-dni': dni,
      'x-user-rol': rol,
    }
  }).then((r) => {
    if (!r.ok) throw new Error('Error al obtener los turnos del cliente')
    return r.json()
  })
}

/* export const getTurnoById = async ({ id_turno, dni, rol }) => {
  return await fetch(`${BASE_URL}/api/turnos/${id_turno}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-dni': dni,
      'x-user-rol': rol,
    }
  }).then((r) => {
    if (!r.ok) throw new Error('Error al obtener el turno')
    return r.json()
  })
} */

export const getTurnoById = async ({ id_turno, dni, rol }) => {
  return await fetch(`${BASE_URL}/api/turnos/${id_turno}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-dni': dni,
      'x-user-rol': rol,
    }
  }).then((r) => {
    if (!r.ok) throw new Error('Error al obtener el turno')
    return r.json()
  })
}

export const cancelTurnoById = async (id, requesterDni, requesterRol) => {
  const r = await fetch(`${BASE_URL}/api/turnos/${id}/cancelacion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-dni': requesterDni,
      'x-user-rol': requesterRol,
    }
  })
  if (!r.ok) {
    const body = await r.json().catch(() => ({}))
    const err = new Error(body.message ?? 'Error al cancelar el turno')
    err.status = r.status
    err.code = body.code
    throw err
  }
  return r.json()
}