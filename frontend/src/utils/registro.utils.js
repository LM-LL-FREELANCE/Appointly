export const OPCIONES_GENERO = ['Masculino', 'Femenino', 'Prefiero no decirlo']

export const toGeneroCode = (genero) => {
  if (genero === 'Masculino') return 'M'
  if (genero === 'Femenino') return 'F'
  return 'X'
}

export const isIdentityError = (code) =>
  code === 'IDENTITY_VERIFICATION_REQUIRED' || code === 'IDENTITY_VERIFICATION_FAILED'

export const formatearFechaISO = (fecha) => {
  if (!fecha) return null
  if (fecha instanceof Date) {
    const y = fecha.getFullYear()
    const m = String(fecha.getMonth() + 1).padStart(2, '0')
    const d = String(fecha.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return String(fecha).slice(0, 10)
}

export const calcularEdad = (fecha) => {
  if (!fecha) return 0
  const d = fecha instanceof Date ? fecha : new Date(fecha)
  if (isNaN(d.getTime())) return 0
  const hoy = new Date()
  let edad = hoy.getFullYear() - d.getFullYear()
  const m = hoy.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) {
    edad--
  }
  return edad
}

/**
 * Builds the request body for a role from the form values.
 * - admin: DNI and correo come from the invitation, so they are never sent.
 * - hidePersonalData: the person already exists, its stored data is kept.
 */
export const buildRegistroPayload = (role, values, { hidePersonalData = false, includeExistingPassword = false } = {}) => {
  const payload = { password: values.password, confirm: values.confirm }

  if (role !== 'admin') {
    payload.dni = values.dni
    payload.correo = values.correo
  }

  if (!hidePersonalData) {
    payload.nombre = values.nombre
    payload.apellido = values.apellido
    payload.fecha_nacimiento = formatearFechaISO(values.fecha_nacimiento)
    payload.genero = toGeneroCode(values.genero)
  }

  if (role === 'cliente') payload.id_obra_social = values.id_obra_social ? Number(values.id_obra_social) : null
  if (role === 'profesional') payload.numero_matricula = values.numero_matricula
  if (includeExistingPassword) payload.password_cuenta_existente = values.password_cuenta_existente

  return payload
}
