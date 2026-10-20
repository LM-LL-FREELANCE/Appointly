import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startTestApp, proximoDiaSemana, PROF, CLIENTE, ADMIN } from "./helpers/test-app.js"
import { assertError } from "./helpers/asserts.js"
import { ahoraEnTimezone, enMinutos } from "../src/utils/time.js"
import {
  calcularSlotsDisponibles, cancelacionVencida, estaDiaHabilitado, reservaDemasiadoPronto,
} from "../src/utils/helperSlots.js"

// WS3 — políticas del centro aplicadas a slots, reservas, reprogramación y
// cancelación (PLAN_ADMIN.md §11.1–§11.4/§11.6).

let t

before(async () => {
  t = await startTestApp()
})
after(async () => {
  await t?.close()
})

const ACTORES = {
  cliente: { dni: CLIENTE, role: "cliente" },
  profesional: { dni: PROF, role: "profesional" },
  admin: { dni: ADMIN, role: "admin" },
}

const asAdmin = ACTORES.admin

const configBody = (overrides = {}) => ({
  nombre_centro: "Centro Medico Appointly",
  telefono: "11 4000-0000",
  email_institucional: "contacto@appointly.dev",
  direccion: "Av. Siempre Viva 742, Salta",
  anticipacion_reserva_min: 0,
  limite_cancelacion_horas: 0,
  dias_habiles: [1, 2, 3, 4, 5, 6],
  hora_apertura: "08:00",
  hora_cierre: "20:00",
  ...overrides,
})

const putConfig = async (overrides = {}) => {
  const res = await t.api("PUT", "/api/admin/configuracion", { as: asAdmin, body: configBody(overrides) })
  assert.equal(res.status, 200, JSON.stringify(res.body))
  return res.body
}

const getSlots = (fecha) => t.api(
  "GET",
  `/api/profesionales/${PROF}/slots?desde=${fecha}&hasta=${fecha}`,
  { as: ACTORES.cliente },
)

const crear = (fecha, hora) => t.api("POST", "/api/turnos", {
  as: ACTORES.cliente,
  body: { dni_profesional: PROF, fecha_turno: fecha, hora_turno: hora },
})

// --- unidad: helpers puros ----------------------------------------------------------------

test("helpers: día hábil, anticipación y franja global", () => {
  const lunes = "2026-10-19"
  const martes = "2026-10-20"

  assert.equal(estaDiaHabilitado({ dias_habiles: [1] }, lunes), true)
  assert.equal(estaDiaHabilitado({ dias_habiles: [1] }, martes), false)
  assert.equal(estaDiaHabilitado(null, martes), true)

  const ahora = new Date("2026-06-15T12:00:00Z") // 09:00 en Buenos Aires
  assert.equal(reservaDemasiadoPronto("2026-06-15", "09:30", { anticipacion_reserva_min: 60 }, ahora), true)
  assert.equal(reservaDemasiadoPronto("2026-06-15", "10:01", { anticipacion_reserva_min: 60 }, ahora), false)

  const horarios = [{ dia_semana: 1, hora_inicio: "08:00:00", hora_fin: "13:00:00" }]
  const lunesFuturo = proximoDiaSemana(1, 30)
  const dias = calcularSlotsDisponibles({
    horarios,
    turnos: [],
    desde: lunesFuturo,
    hasta: lunesFuturo,
    duracion: 30,
    config: { dias_habiles: [1, 2, 3, 4, 5], hora_apertura: "10:00", hora_cierre: "12:00", anticipacion_reserva_min: 0 },
  })
  assert.deepEqual(dias[0].slots, ["10:00", "10:30", "11:00", "11:30"])

  const limiteCancelacion = cancelacionVencida(
    "2026-06-15", "11:00", 2, { fecha: "2026-06-15", hora: "09:30" },
  )
  assert.equal(limiteCancelacion, true)
  assert.equal(cancelacionVencida("2026-06-15", "11:00", 2, { fecha: "2026-06-15", hora: "09:00" }), false)
})

// --- días hábiles ------------------------------------------------------------------------

test("días hábiles: un día no habilitado no ofrece slots y la reserva directa es 409 CENTER_CLOSED", async () => {
  await putConfig({ dias_habiles: [1] }) // solo lunes
  const miercoles = proximoDiaSemana(3, 14) // Aguirre atiende miércoles

  const slots = await getSlots(miercoles)
  assert.equal(slots.status, 200)
  assert.deepEqual(slots.body.dias[0].slots, [])

  assertError(await crear(miercoles, "09:00"), 409, "CENTER_CLOSED")
})

// --- franja global -----------------------------------------------------------------------

test("franja global: recorta los slots a la ventana del centro y la reserva fuera da OUT_OF_SCHEDULE", async () => {
  await putConfig({ dias_habiles: [1], hora_apertura: "10:00", hora_cierre: "12:00" })
  const lunes = proximoDiaSemana(1, 21)

  const slots = await getSlots(lunes)
  assert.equal(slots.status, 200)
  assert.deepEqual(slots.body.dias[0].slots, ["10:00", "10:30", "11:00", "11:30"])

  assertError(await crear(lunes, "09:00"), 409, "OUT_OF_SCHEDULE")
  assert.equal((await crear(lunes, "10:00")).status, 201)
})

// --- anticipación mínima -----------------------------------------------------------------

test("anticipación: los slots dentro de la ventana no se ofrecen y la reserva es 409 BOOKING_TOO_SOON", async () => {
  await putConfig({ dias_habiles: [1], anticipacion_reserva_min: 43_200 }) // 30 días
  const lunes = proximoDiaSemana(1, 2)

  const slots = await getSlots(lunes)
  assert.equal(slots.status, 200)
  assert.deepEqual(slots.body.dias[0].slots, [])

  assertError(await crear(lunes, "09:00"), 409, "BOOKING_TOO_SOON")
})

// --- cancelación -------------------------------------------------------------------------

test("límite de cancelación: cliente/profesional no pueden a 1 h, el admin sí", async () => {
  await putConfig({ limite_cancelacion_horas: 2 })
  const enUnaHora = enMinutos(60)
  const id = await t.insertTurno({ ...enUnaHora, estado: "confirmado" })

  const cancelar = (actor) => t.api("POST", `/api/turnos/${id}/cancelacion`, {
    as: ACTORES[actor],
    body: { motivo: "Prueba de política" },
  })

  assertError(await cancelar("cliente"), 409, "CANCEL_TOO_LATE")
  assertError(await cancelar("profesional"), 409, "CANCEL_TOO_LATE")
  assert.equal((await t.getTurno(id)).estado, "confirmado")

  const admin = await cancelar("admin")
  assert.equal(admin.status, 200)
  assert.equal(admin.body.estado, "cancelado")
})

test("límite de cancelación 0: no hay ventana (se puede cancelar hasta el inicio)", async () => {
  await putConfig({ limite_cancelacion_horas: 0 })
  const enUnaHora = enMinutos(60)
  const id = await t.insertTurno({ ...enUnaHora, estado: "confirmado" })

  const res = await t.api("POST", `/api/turnos/${id}/cancelacion`, {
    as: ACTORES.cliente,
    body: { motivo: "Sin límite" },
  })
  assert.equal(res.status, 200)
})

// --- duración por profesional ------------------------------------------------------------

test("duración por profesional: GET /slots y la reserva usan su grilla (45 min)", async () => {
  await putConfig({ dias_habiles: [1], hora_apertura: "08:00", hora_cierre: "20:00" })
  await t.pool.query("UPDATE profesional SET duracion_turno_min = 45 WHERE dni_profesional = ?", [PROF])
  const lunes = proximoDiaSemana(1, 35)

  try {
    const slots = await getSlots(lunes)
    assert.equal(slots.status, 200)
    assert.equal(slots.body.duracion_min, 45)
    assert.ok(slots.body.dias[0].slots.includes("08:45"))
    assert.equal(slots.body.dias[0].slots.includes("08:30"), false)

    assertError(await crear(lunes, "08:30"), 409, "OUT_OF_SCHEDULE")
    assert.equal((await crear(lunes, "08:45")).status, 201)
  } finally {
    await t.pool.query("UPDATE profesional SET duracion_turno_min = 30 WHERE dni_profesional = ?", [PROF])
  }
})

// --- reprogramación ----------------------------------------------------------------------

test("reprogramación: no se puede mover a un día no habilitado (409 CENTER_CLOSED)", async () => {
  await putConfig({ dias_habiles: [1] }) // solo lunes
  const lunes = proximoDiaSemana(1, 14)
  const domingo = proximoDiaSemana(0, 14)
  const id = await t.insertTurno({ fecha: lunes, hora: "09:00", estado: "confirmado" })

  const res = await t.api("POST", `/api/turnos/${id}/reprogramacion`, {
    as: ACTORES.profesional,
    body: { fecha_turno: domingo, hora_turno: "09:00", motivo: "Prueba" },
  })

  assertError(res, 409, "CENTER_CLOSED")
  assert.equal((await t.getTurno(id)).estado, "confirmado")
})

// --- sanity del reloj --------------------------------------------------------------------

test("ahoraEnTimezone devuelve una fecha real para el cálculo de políticas", () => {
  const ahora = ahoraEnTimezone()
  assert.match(ahora.fecha, /^\d{4}-\d{2}-\d{2}$/)
  assert.match(ahora.hora, /^\d{2}:\d{2}$/)
})
