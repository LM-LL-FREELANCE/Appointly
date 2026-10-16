// Single source of truth for turno states in the UI (mirrors the backend enum and
// ESTADOS_ABIERTOS / cancel rules in backend/src/services/turnos.service.js).
// Plain JS with no imports so Node can test it directly.

export const ESTADO_LABEL = {
  pendiente_confirmacion: 'Pendiente de confirmación',
  confirmado: 'Confirmado',
  en_espera: 'En espera',
  en_curso: 'En curso',
  completado: 'Completado',
  ausente: 'Ausente',
  reprogramado: 'Reprogramado',
  cancelado: 'Cancelado',
}

export const ESTADO_COLOR = {
  pendiente_confirmacion: 'violet',
  confirmado: 'teal',
  en_espera: 'cyan',
  en_curso: 'blue',
  completado: 'gray',
  ausente: 'orange',
  reprogramado: 'yellow',
  cancelado: 'red',
}

// Turnos still pending attention. The API accepts `estado=abiertos` for this set.
export const ESTADOS_ABIERTOS = ['pendiente_confirmacion', 'confirmado', 'en_espera', 'en_curso']

const ESTADOS_CANCELABLES = ['pendiente_confirmacion', 'confirmado']

export const esAbierto = (estado) => ESTADOS_ABIERTOS.includes(estado)

export const esCancelable = (estado) => ESTADOS_CANCELABLES.includes(estado)

export const estadoLabel = (estado) => ESTADO_LABEL[estado] ?? estado ?? ''
