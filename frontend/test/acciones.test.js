import { test } from "node:test"
import assert from "node:assert/strict"
import { accionesProfesional, describirEvento } from "../src/utils/estadosTurno.js"
import { claveAccion, diasReprogramables } from "../src/utils/estadosTurno.js"
import { ahoraEnZona, fechaEnDias, fechaISODeApi, formatearFechaHoraEvento, ventanaReprogramacion } from "../src/utils/fechas.utils.js"

// "Now" is 2026-06-15 10:30 in Buenos Aires.
const AHORA = { fecha: "2026-06-15", hora: "10:30" }
const turno = (estado, fecha, hora = "12:00:00") => ({ estado, fecha_turno: `${fecha}T03:00:00.000Z`, hora_turno: hora })
const REPROGRAMAR = { reprogramar: true, label: "Reprogramar" }
const estados = (t, ahora = AHORA) => accionesProfesional(t, ahora).map(claveAccion)

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
    REPROGRAMAR,
    { cancelar: true, label: "Cancelar turno" },
  ])
})

test("confirmado today and already started: iniciar, ausente, completado (both with confirmation) and cancel", () => {
  assert.deepEqual(accionesProfesional(turno("confirmado", "2026-06-15", "10:00:00"), AHORA), [
    { estado: "en_curso", label: "Iniciar atención" },
    { estado: "ausente", label: "Marcar ausente", confirmar: true },
    { estado: "completado", label: "Marcar completado", confirmar: true },
    REPROGRAMAR,
    { cancelar: true, label: "Cancelar turno" },
  ])
})

test("the start minute itself counts as started (<= now)", () => {
  assert.deepEqual(estados(turno("confirmado", "2026-06-15", "10:30:00")), ["en_curso", "ausente", "completado", "reprogramar", "cancelar"])
  assert.deepEqual(estados(turno("confirmado", "2026-06-15", "10:31:00")), ["en_curso", "reprogramar", "cancelar"])
})

test("confirmado on a future day: reprogramar and cancel", () => {
  assert.deepEqual(estados(turno("confirmado", "2026-06-16", "08:00:00")), ["reprogramar", "cancelar"])
})

test("confirmado on a past day: no iniciar (not today), but ausente/completado/cancel", () => {
  assert.deepEqual(estados(turno("confirmado", "2026-06-14", "08:00:00")), ["ausente", "completado", "reprogramar", "cancelar"])
})

test("en_espera follows the same rules as confirmado, without cancel and without reprogramar", () => {
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

test("pendiente_confirmacion: reprogramar and cancel (confirming is future work)", () => {
  assert.deepEqual(estados(turno("pendiente_confirmacion", "2026-06-15", "10:00:00")), ["reprogramar", "cancelar"])
})

test("ausente: only reprogramar (the patient came late; the original stays ausente)", () => {
  assert.deepEqual(accionesProfesional(turno("ausente", "2026-06-15", "10:00:00"), AHORA), [REPROGRAMAR])
  assert.deepEqual(estados(turno("ausente", "2026-06-10", "10:00:00")), ["reprogramar"])
})

for (const estado of ["completado", "reprogramado", "cancelado"]) {
  test(`${estado}: no actions at all`, () => {
    assert.deepEqual(accionesProfesional(turno(estado, "2026-06-15", "10:00:00"), AHORA), [])
  })
}

test("the day rule uses Buenos Aires, not the machine: 23:30 ART is still the same day", () => {
  const casiMedianoche = ahoraEnZona(new Date("2026-06-16T02:30:00Z")) // 23:30 ART on the 15th
  assert.deepEqual(estados(turno("confirmado", "2026-06-15", "23:45:00"), casiMedianoche), ["en_curso", "reprogramar", "cancelar"])
  assert.deepEqual(estados(turno("confirmado", "2026-06-16", "08:00:00"), casiMedianoche), ["reprogramar", "cancelar"])
})

test("accionesProfesional defaults 'now' to the real clock (no crash without the argument)", () => {
  const lejano = { estado: "confirmado", fecha_turno: "2999-01-01T03:00:00.000Z", hora_turno: "09:00:00" }
  assert.deepEqual(accionesProfesional(lejano).map((a) => a.estado ?? (a.reprogramar ? "reprogramar" : "cancelar")), ["reprogramar", "cancelar"])
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

test("claveAccion is the target estado, or 'reprogramar' / 'cancelar'", () => {
  assert.equal(claveAccion({ estado: "en_curso", label: "x" }), "en_curso")
  assert.equal(claveAccion(REPROGRAMAR), "reprogramar")
  assert.equal(claveAccion({ cancelar: true, label: "x" }), "cancelar")
})

test("describirEvento: Confirmado → Reprogramado shows the motivo", () => {
  const e = { estado_anterior: "confirmado", estado_nuevo: "reprogramado", dni_actor: 27845123, rol_actor: "profesional", actor_nombre: "Martin", actor_apellido: "Aguirre", motivo: "Urgencia en guardia" }
  assert.deepEqual(describirEvento(e), { titulo: "Confirmado → Reprogramado", actor: "Martin Aguirre (profesional)", motivo: "Urgencia en guardia", estadoNuevo: "reprogramado" })
})

// --- reprogramar: window and free days --------------------------------------------------

test("fechaEnDias does calendar arithmetic on YYYY-MM-DD", () => {
  assert.equal(fechaEnDias(1, "2026-06-30"), "2026-07-01")
  assert.equal(fechaEnDias(29, "2026-06-15"), "2026-07-14")
  assert.equal(fechaEnDias(-1, "2026-03-01"), "2026-02-28")
  assert.equal(fechaEnDias(0, "2026-06-15"), "2026-06-15")
})

test("ventanaReprogramacion spans from today for 30 days (within the backend's 31-day limit)", () => {
  assert.deepEqual(ventanaReprogramacion(AHORA), { desde: "2026-06-15", hasta: "2026-07-14" })
  assert.deepEqual(ventanaReprogramacion(AHORA, 7), { desde: "2026-06-15", hasta: "2026-06-21" })
})

const DIAS = [
  { fecha: "2026-06-14", dia_semana: 0, slots: ["09:00"] }, // past day (never returned, but be safe)
  { fecha: "2026-06-15", dia_semana: 1, slots: ["09:00", "10:30", "11:00", "16:00"] }, // today, now is 10:30
  { fecha: "2026-06-16", dia_semana: 2, slots: [] },
  { fecha: "2026-06-17", dia_semana: 3, slots: ["08:00", "08:30"] },
]

test("diasReprogramables drops past days, slots that already passed today (<= now), and empty days", () => {
  assert.deepEqual(diasReprogramables({ dias: DIAS, ahora: AHORA }), [
    { fecha: "2026-06-15", slots: ["11:00", "16:00"] },
    { fecha: "2026-06-17", slots: ["08:00", "08:30"] },
  ])
})

test("diasReprogramables: the slot exactly at the current minute is not offered (must be strictly future)", () => {
  const [hoy] = diasReprogramables({ dias: DIAS, ahora: { fecha: "2026-06-15", hora: "11:00" } })
  assert.deepEqual(hoy.slots, ["16:00"])
})

test("diasReprogramables excludes the original turno's own date and time, and drops the day if it was the only slot", () => {
  const original = { fecha_turno: "2026-06-17T03:00:00.000Z", hora_turno: "08:30:00" }
  assert.deepEqual(diasReprogramables({ dias: DIAS, ahora: AHORA, original }).at(-1), { fecha: "2026-06-17", slots: ["08:00"] })

  const unico = [{ fecha: "2026-06-18", dia_semana: 4, slots: ["09:00"] }]
  assert.deepEqual(diasReprogramables({ dias: unico, ahora: AHORA, original: { fecha_turno: "2026-06-18T03:00:00.000Z", hora_turno: "09:00:00" } }), [])
})

test("diasReprogramables tolerates a missing payload", () => {
  assert.deepEqual(diasReprogramables({ dias: undefined, ahora: AHORA }), [])
})
