import { emitToAdmins, emitToMfa } from "./index.js"

/**
 * API de emisión server-side del tiempo real (PLAN_ADMIN.md §9).
 * Para WS3/WS4/WS5 (controllers y services del panel): llamar SIEMPRE después
 * de que la escritura commiteó. Los payloads viajan tal cual al cliente; mandar
 * objetos CHICOS (ids, fecha/hora, nombres), nunca filas completas con datos
 * sensibles.
 *
 * Sala `admins` (sesión de admin conectada):
 *   emitTurnoCreado(payload)      -> 'turno:creado'
 *   emitTurnoCancelado(payload)   -> 'turno:cancelado'
 *   emitTurnoReasignado(payload)  -> 'turno:reasignado'
 *   emitAvisoPublicado(payload)   -> 'aviso:publicado'  (alta o edición de aviso)
 *     alias: emitAvisoCreado
 *
 * Sala `mfa:<id_codigo>` (pantalla de login admin):
 *   emitMfaCodigoEnviado(idCodigo)
 *   emitMfaIntentoFallido(idCodigo, restantes)
 *   emitMfaVerificado(idCodigo)
 *   emitMfaBloqueado(idCodigo)
 *
 * Payloads sugeridos (contrato mínimo con Ola 2):
 *   turno: { id_turno, estado, fecha_turno, hora_turno, cliente?, profesional? }
 *   aviso: { id_aviso, titulo, tipo, activo }
 *
 * Escape hatch para eventos futuros: emitToAdmins(evento, payload) y
 * emitToMfa(idCodigo, evento, payload).
 */
export const emitTurnoCreado = (payload) => emitToAdmins("turno:creado", payload)

export const emitTurnoCancelado = (payload) => emitToAdmins("turno:cancelado", payload)

export const emitTurnoReasignado = (payload) => emitToAdmins("turno:reasignado", payload)

// En el wire el evento es 'aviso:publicado' (cubre alta y edición, §9).
export const emitAvisoPublicado = (payload) => emitToAdmins("aviso:publicado", payload)

export const emitAvisoCreado = emitAvisoPublicado

export const emitMfaCodigoEnviado = (idCodigo) => emitToMfa(idCodigo, "mfa:codigo_enviado")

export const emitMfaIntentoFallido = (idCodigo, restantes) =>
  emitToMfa(idCodigo, "mfa:intento_fallido", { restantes })

export const emitMfaVerificado = (idCodigo) => emitToMfa(idCodigo, "mfa:verificado")

export const emitMfaBloqueado = (idCodigo) => emitToMfa(idCodigo, "mfa:bloqueado")

export { emitToAdmins, emitToMfa }
