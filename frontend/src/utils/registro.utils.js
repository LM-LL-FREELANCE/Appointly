export const OPCIONES_GENERO = ['Masculino', 'Femenino', 'Prefiero no decirlo']

export const toGeneroCode = (genero) => {
  if (genero === 'Masculino') return 'M'
  if (genero === 'Femenino') return 'F'
  return 'X'
}

export const isIdentityError = (code) =>
  code === 'IDENTITY_VERIFICATION_REQUIRED' || code === 'IDENTITY_VERIFICATION_FAILED'

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
    payload.fecha_nacimiento = values.fecha_nacimiento
    payload.genero = toGeneroCode(values.genero)
  }

  if (role === 'cliente') payload.id_obra_social = values.id_obra_social ? Number(values.id_obra_social) : null
  if (role === 'profesional') payload.numero_matricula = values.numero_matricula
  if (includeExistingPassword) payload.password_cuenta_existente = values.password_cuenta_existente

  return payload
}
