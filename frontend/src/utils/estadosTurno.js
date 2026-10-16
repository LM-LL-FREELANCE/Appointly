// Single source of truth for turno states in the UI (mirrors the backend enum and
// ESTADOS_ABIERTOS / cancel rules in backend/src/services/turnos.service.js).
// Plain JS (no JSX) so Node can test it directly.

import { ahoraEnZona, fechaISODeApi } from './fechas.utils.js'

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

// --- Actions of the professional on a turno -----------------------------------------------
// Mirror of the backend transition matrix (services/turnos.service.js). The backend stays
// authoritative: if the UI is out of sync its 409 message is shown.
//
// `ahora` is { fecha: 'YYYY-MM-DD', hora: 'HH:MM' } in Buenos Aires (injectable for tests).
// Returns the ordered actions: { estado, label, confirmar? } or { cancelar: true, label }.
export function accionesProfesional(turno, ahora = ahoraEnZona()) {
  const { estado } = turno
  const enAtencion = estado === 'confirmado' || estado === 'en_espera'
  const fecha = fechaISODeApi(turno.fecha_turno)
  const esHoy = fecha === ahora.fecha
  const yaComenzo = `${fecha}T${String(turno.hora_turno).slice(0, 5)}` <= `${ahora.fecha}T${ahora.hora}`

  const acciones = []
  if (enAtencion && esHoy) acciones.push({ estado: 'en_curso', label: 'Iniciar atención' })
  if (enAtencion && yaComenzo) acciones.push({ estado: 'ausente', label: 'Marcar ausente', confirmar: true })
  if (estado === 'en_curso' || (enAtencion && yaComenzo)) {
    acciones.push({ estado: 'completado', label: 'Marcar completado', confirmar: true })
  }
  if (esCancelable(estado)) acciones.push({ cancelar: true, label: 'Cancelar turno' })

  return acciones
}

// --- History (turno_evento) -----------------------------------------------------------------

const actorDeEvento = (e) => {
  if (!e.dni_actor) return 'Autor desconocido'
  const nombre = [e.actor_nombre, e.actor_apellido].filter(Boolean).join(' ') || `DNI ${e.dni_actor}`
  return e.rol_actor ? `${nombre} (${e.rol_actor})` : nombre
}

// Display data of one event: { titulo, actor, motivo, estadoNuevo }.
export function describirEvento(e) {
  return {
    titulo: e.estado_anterior ? `${estadoLabel(e.estado_anterior)} → ${estadoLabel(e.estado_nuevo)}` : 'Turno creado',
    actor: actorDeEvento(e),
    motivo: e.motivo || null,
    estadoNuevo: e.estado_nuevo,
  }
}
