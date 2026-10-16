import { test } from "node:test"
import assert from "node:assert/strict"
import { accionesProfesional, describirEvento } from "../src/utils/estadosTurno.js"
import { ahoraEnZona, fechaISODeApi, formatearFechaHoraEvento } from "../src/utils/fechas.utils.js"

// "Now" is 2026-06-15 10:30 in Buenos Aires.
const AHORA = { fecha: "2026-06-15", hora: "10:30" }
const turno = (estado, fecha, hora = "12:00:00") => ({ estado, fecha_turno: `${fecha}T03:00:00.000Z`, hora_turno: hora })
const estados = (t, ahora = AHORA) => accionesProfesional(t, ahora).map((a) => a.estado ?? "cancelar")

// --- dates ------------------------------------------------------------------------------

test("ahoraEnZona converts an instant to Buenos Aires date and time (UTC-3, crossing midnight)", () => {
  assert.deepEqual(ahoraEnZona(new Date("2026-06-15T13:30:00Z")), { fecha: "2026-06-15", hora: "10:30" })
  assert.deepEqual(ahoraEnZona(new Date("2026-06-15T02:59:00Z")), { fecha: "2026-06-14", hora: "23:59" })
  assert.deepEqual(ahoraEnZona(new Date("2026-06-15T03:00:00Z")), { fecha: "2026-06-15", hora: "00:00" })
})

test("fechaISODeApi takes the calendar day of the ISO fecha_turno the API returns", () => {
  assert.equal(fechaISODeApi("2026-07-03T03:00:00.000Z"), "2026-07-03")
  assert.equal(fechaISODeApi("2026-07-03"), "2026-07-03")
  assert.equal(fechaISODeApi(undefined), "")
})

test("formatearFechaHoraEvento renders es-AR style in Buenos Aires time, independent of the machine zone", () => {
  assert.equal(formatearFechaHoraEvento("2026-06-15T13:30:00.000Z"), "15 jun 2026 · 10:30 hs")
  assert.equal(formatearFechaHoraEvento("2026-01-01T02:05:00.000Z"), "31 dic 2025 · 23:05 hs")
  assert.equal(formatearFechaHoraEvento(null), "")
})

// --- accionesProfesional: one case per rule --------------------------------------------

test("confirmado today, not started: only Iniciar atención and cancel", () => {
  assert.deepEqual(accionesProfesional(turno("confirmado", "2026-06-15", "12:00:00"), AHORA), [
    { estado: "en_curso", label: "Iniciar atención" },
    { cancelar: true, label: "Cancelar turno" },
  ])
})

test("confirmado today and already started: iniciar, ausente, completado (both with confirmation) and cancel", () => {
  assert.deepEqual(accionesProfesional(turno("confirmado", "2026-06-15", "10:00:00"), AHORA), [
    { estado: "en_curso", label: "Iniciar atención" },
    { estado: "ausente", label: "Marcar ausente", confirmar: true },
    { estado: "completado", label: "Marcar completado", confirmar: true },
    { cancelar: true, label: "Cancelar turno" },
  ])
})

test("the start minute itself counts as started (<= now)", () => {
  assert.deepEqual(estados(turno("confirmado", "2026-06-15", "10:30:00")), ["en_curso", "ausente", "completado", "cancelar"])
  assert.deepEqual(estados(turno("confirmado", "2026-06-15", "10:31:00")), ["en_curso", "cancelar"])
})

test("confirmado on a future day: only cancel", () => {
  assert.deepEqual(estados(turno("confirmado", "2026-06-16", "08:00:00")), ["cancelar"])
})

test("confirmado on a past day: no iniciar (not today), but ausente/completado/cancel", () => {
  assert.deepEqual(estados(turno("confirmado", "2026-06-14", "08:00:00")), ["ausente", "completado", "cancelar"])
})

test("en_espera follows the same rules as confirmado, without cancel", () => {
  assert.deepEqual(estados(turno("en_espera", "2026-06-15", "12:00:00")), ["en_curso"])
  assert.deepEqual(estados(turno("en_espera", "2026-06-15", "10:00:00")), ["en_curso", "ausente", "completado"])
  assert.deepEqual(estados(turno("en_espera", "2026-06-16", "08:00:00")), [])
  assert.deepEqual(estados(turno("en_espera", "2026-06-14", "08:00:00")), ["ausente", "completado"])
})

test("en_curso: only completado, whatever the date, and it asks for confirmation", () => {
  assert.deepEqual(accionesProfesional(turno("en_curso", "2026-06-16", "08:00:00"), AHORA), [
    { estado: "completado", label: "Marcar completado", confirmar: true },
  ])
  assert.deepEqual(estados(turno("en_curso", "2026-06-15", "12:00:00")), ["completado"])
  assert.deepEqual(estados(turno("en_curso", "2026-06-14", "08:00:00")), ["completado"])
})

test("pendiente_confirmacion: only cancel (confirming is future work)", () => {
  assert.deepEqual(estados(turno("pendiente_confirmacion", "2026-06-15", "10:00:00")), ["cancelar"])
})

for (const estado of ["completado", "ausente", "reprogramado", "cancelado"]) {
  test(`${estado}: no actions at all`, () => {
    assert.deepEqual(accionesProfesional(turno(estado, "2026-06-15", "10:00:00"), AHORA), [])
  })
}

test("the day rule uses Buenos Aires, not the machine: 23:30 ART is still the same day", () => {
  const casiMedianoche = ahoraEnZona(new Date("2026-06-16T02:30:00Z")) // 23:30 ART on the 15th
  assert.deepEqual(estados(turno("confirmado", "2026-06-15", "23:45:00"), casiMedianoche), ["en_curso", "cancelar"])
  assert.deepEqual(estados(turno("confirmado", "2026-06-16", "08:00:00"), casiMedianoche), ["cancelar"])
})

test("accionesProfesional defaults 'now' to the real clock (no crash without the argument)", () => {
  const lejano = { estado: "confirmado", fecha_turno: "2999-01-01T03:00:00.000Z", hora_turno: "09:00:00" }
  assert.deepEqual(accionesProfesional(lejano).map((a) => a.estado ?? "cancelar"), ["cancelar"])
})

// --- describirEvento --------------------------------------------------------------------

test("describirEvento: the first event (no estado_anterior) is 'Turno creado'", () => {
  const e = { estado_anterior: null, estado_nuevo: "confirmado", dni_actor: 22456789, rol_actor: "cliente", actor_nombre: "Ricardo", actor_apellido: "Sosa", motivo: null }
  assert.deepEqual(describirEvento(e), { titulo: "Turno creado", actor: "Ricardo Sosa (cliente)", motivo: null, estadoNuevo: "confirmado" })
})

test("describirEvento: a transition uses the readable labels of both states", () => {
  const e = { estado_anterior: "confirmado", estado_nuevo: "en_curso", dni_actor: 27845123, rol_actor: "profesional", actor_nombre: "Martin", actor_apellido: "Aguirre", motivo: "Llegó a horario" }
  assert.deepEqual(describirEvento(e), { titulo: "Confirmado → En curso", actor: "Martin Aguirre (profesional)", motivo: "Llegó a horario", estadoNuevo: "en_curso" })
})

test("describirEvento: an event without actor says 'Autor desconocido'", () => {
  const e = { estado_anterior: "en_curso", estado_nuevo: "completado", dni_actor: null, rol_actor: null, actor_nombre: null, actor_apellido: null, motivo: "" }
  const d = describirEvento(e)
  assert.equal(d.actor, "Autor desconocido")
  assert.equal(d.motivo, null, "an empty motivo is not shown")
})

test("describirEvento: an actor whose name is unknown falls back to the DNI", () => {
  const e = { estado_anterior: "confirmado", estado_nuevo: "cancelado", dni_actor: 10000001, rol_actor: "admin", actor_nombre: null, actor_apellido: null, motivo: null }
  assert.equal(describirEvento(e).actor, "DNI 10000001 (admin)")
})
