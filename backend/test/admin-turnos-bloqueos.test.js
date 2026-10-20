import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  startTestApp,
  PROF,
  PROF_C,
  CLIENTE,
  OTRO_CLIENTE,
  ADMIN,
  proximoDiaSemana,
} from "./helpers/test-app.js"
import { assertError, assertEvento } from "./helpers/asserts.js"
import { enMinutos, fechaEnDias, rangoMesActual } from "../src/utils/time.js"

let t

before(async () => {
  t = await startTestApp()
})

after(async () => {
  await t?.close()
})

beforeEach(async () => {
  await t.pool.query("DELETE FROM bloqueo_agenda")
})

const ACTORES = {
  cliente: { dni: CLIENTE, role: "cliente" },
  profesional: { dni: PROF, role: "profesional" },
  admin: { dni: ADMIN, role: "admin" },
}

// PROF (27845123) attends Mon/Wed/Fri 08:00-13:00 and Mon/Wed 16:00-20:00.
// PROF_C (28934567, Fernandez) attends Mon/Tue/Thu 10:00-18:00.
// So Monday 16:30 is inside BOTH agendas, while Monday 08:30 is only in PROF's!

test("T1: GET /api/admin/turnos lists month by default with both counterparts and supports filters", async () => {
  const { desde, hasta } = rangoMesActual()
  const res = await t.api("GET", "/api/admin/turnos", { as: ACTORES.admin })

  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body))
  assert.ok(res.body.length > 0, "seed has turnos in the current month")

  const primero = res.body[0]
  for (const campo of [
    "id_turno",
    "fecha_turno",
    "hora_turno",
    "estado",
    "dni_cliente",
    "c_nombre",
    "c_apellido",
    "nombre",
    "apellido",
    "dni_profesional",
    "p_nombre",
    "p_apellido",
  ]) {
    assert.ok(campo in primero, `missing field ${campo}`)
  }

  // Filter by profesional + estado + cliente
  const fecha = proximoDiaSemana(3, 2) // Wednesday
  const id = await t.insertTurno({
    fecha,
    hora: "10:00",
    estado: "confirmado",
    profesional: PROF,
    cliente: CLIENTE,
  })

  const filtrado = await t.api(
    "GET",
    `/api/admin/turnos?desde=${fecha}&hasta=${fecha}&estado=confirmado&profesional=${PROF}&cliente=${CLIENTE}`,
    { as: ACTORES.admin },
  )
  assert.equal(filtrado.status, 200)
  assert.ok(filtrado.body.some((x) => x.id_turno === id))
  assert.ok(filtrado.body.every((x) => x.dni_profesional === PROF && x.estado === "confirmado"))

  // Non-admin is rejected
  const noAdmin = await t.api("GET", `/api/admin/turnos?desde=${desde}&hasta=${hasta}`, {
    as: ACTORES.cliente,
  })
  assertError(noAdmin, 403, "FORBIDDEN")
})

test("T2: admin cancellation requires motivo (MOTIVO_REQUIRED) and notifies both parties", async () => {
  const fecha = proximoDiaSemana(3, 2)
  const id = await t.insertTurno({ fecha, hora: "10:30", estado: "confirmado" })

  // Without motivo -> 400 MOTIVO_REQUIRED
  const sinMotivo = await t.api("POST", `/api/admin/turnos/${id}/cancelacion`, {
    as: ACTORES.admin,
    body: { motivo: "   " },
  })
  assertError(sinMotivo, 400, "MOTIVO_REQUIRED")
  assert.equal((await t.getTurno(id)).estado, "confirmado")

  // Spy on EmailMethods.turnoCanceladoPorAdmin
  let emailData = null
  const origEmail = t.EmailMethods.turnoCanceladoPorAdmin
  t.EmailMethods.turnoCanceladoPorAdmin = async (args) => {
    emailData = args
    return { cliente: {}, profesional: {} }
  }

  try {
    const ok = await t.api("POST", `/api/admin/turnos/${id}/cancelacion`, {
      as: ACTORES.admin,
      body: { motivo: "Falla eléctrica en consultorio" },
    })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.estado, "cancelado")
    assert.equal(ok.body.motivo_cancelacion, "Falla eléctrica en consultorio")
    assert.ok(emailData, "turnoCanceladoPorAdmin must be called")
    assert.equal(emailData.motivo, "Falla eléctrica en consultorio")
    assert.equal(emailData.turno.id_turno, id)
  } finally {
    t.EmailMethods.turnoCanceladoPorAdmin = origEmail
  }
})

test("T3: POST /api/admin/turnos/:id/reasignacion validates slot, schedule, bloqueos and writes audit + event", async () => {
  const lunes = proximoDiaSemana(1, 2) // Mon: PROF 08-13 & 16-20, PROF_C 10-18

  // 1. Out of schedule for PROF_C (08:00 on Monday: PROF works 08-13, PROF_C only 10-18)
  const idFueraHorario = await t.insertTurno({
    fecha: lunes,
    hora: "08:00",
    estado: "confirmado",
    profesional: PROF,
    cliente: CLIENTE,
  })
  const resFuera = await t.api("POST", `/api/admin/turnos/${idFueraHorario}/reasignacion`, {
    as: ACTORES.admin,
    body: { dni_profesional: PROF_C },
  })
  assertError(resFuera, 409, "OUT_OF_SCHEDULE")

  // 2. Slot at 16:30 on Monday (valid for both PROF and PROF_C)
  const idValido = await t.insertTurno({
    fecha: lunes,
    hora: "16:30",
    estado: "confirmado",
    profesional: PROF,
    cliente: CLIENTE,
  })

  // 2a. Blocked agenda on PROF_C -> 409 AGENDA_BLOCKED
  const bloqueoRes = await t.api("POST", "/api/admin/bloqueos", {
    as: ACTORES.admin,
    body: {
      fechas: [lunes],
      hora_inicio: "16:00",
      hora_fin: "17:00",
      dni_profesional: PROF_C,
      motivo: "Reunión médica",
    },
  })
  assert.equal(bloqueoRes.status, 201)

  const resBloq = await t.api("POST", `/api/admin/turnos/${idValido}/reasignacion`, {
    as: ACTORES.admin,
    body: { dni_profesional: PROF_C },
  })
  assertError(resBloq, 409, "AGENDA_BLOCKED")

  // Remove the block
  await t.api("DELETE", `/api/admin/bloqueos/${bloqueoRes.body[0].id_bloqueo}`, {
    as: ACTORES.admin,
  })

  // 2b. Slot taken on PROF_C -> 409 SLOT_TAKEN
  const idOcupante = await t.insertTurno({
    fecha: lunes,
    hora: "16:30",
    estado: "confirmado",
    profesional: PROF_C,
    cliente: OTRO_CLIENTE,
  })
  const resTomado = await t.api("POST", `/api/admin/turnos/${idValido}/reasignacion`, {
    as: ACTORES.admin,
    body: { dni_profesional: PROF_C },
  })
  assertError(resTomado, 409, "SLOT_TAKEN")

  // Free the slot on PROF_C
  await t.pool.query("DELETE FROM turno WHERE id_turno = ?", [idOcupante])

  // 2c. Successful reassignment -> updates turno, writes turno_reasignacion and turno_evento
  const resOk = await t.api("POST", `/api/admin/turnos/${idValido}/reasignacion`, {
    as: ACTORES.admin,
    body: { dni_profesional: PROF_C, motivo: "Derivación interna" },
  })
  assert.equal(resOk.status, 200)
  assert.equal(resOk.body.dni_profesional, PROF_C)

  const [reasignaciones] = await t.pool.query(
    "SELECT * FROM turno_reasignacion WHERE id_turno = ?",
    [idValido],
  )
  assert.equal(reasignaciones.length, 1)
  assert.equal(reasignaciones[0].dni_prof_anterior, PROF)
  assert.equal(reasignaciones[0].dni_prof_nuevo, PROF_C)
  assert.equal(reasignaciones[0].motivo, "Derivación interna")
  assert.equal(reasignaciones[0].creado_por, ADMIN)

  const eventos = await t.getEventos(idValido)
  assert.equal(eventos.length, 1)
  assertEvento(eventos[0], {
    estado_anterior: "confirmado",
    estado_nuevo: "confirmado",
    dni_actor: ADMIN,
    rol_actor: "admin",
    motivo: "Derivación interna",
  })

  // 3. Past turno or closed turno -> 409 NOT_REASSIGNABLE
  const idPasado = await t.insertTurno({
    fecha: fechaEnDias(-2),
    hora: "16:30",
    estado: "confirmado",
    profesional: PROF,
    cliente: CLIENTE,
  })
  const resPasado = await t.api("POST", `/api/admin/turnos/${idPasado}/reasignacion`, {
    as: ACTORES.admin,
    body: { dni_profesional: PROF_C },
  })
  assertError(resPasado, 409, "NOT_REASSIGNABLE")
})

test("T4 & T5: admin can mark started turnos as completado or ausente with event audit", async () => {
  const iniciado = enMinutos(-10)
  const idComp = await t.insertTurno({ ...iniciado, estado: "confirmado" })
  const idAus = await t.insertTurno({ ...iniciado, hora: "08:00", estado: "en_espera" })

  const resComp = await t.api("POST", `/api/admin/turnos/${idComp}/completacion`, {
    as: ACTORES.admin,
    body: { motivo: "Atendido en guardia" },
  })
  assert.equal(resComp.status, 200)
  assert.equal(resComp.body.estado, "completado")
  assert.notEqual(resComp.body.completado_en, null)

  const resAus = await t.api("POST", `/api/admin/turnos/${idAus}/ausencia`, {
    as: ACTORES.admin,
    body: { motivo: "No se presentó" },
  })
  assert.equal(resAus.status, 200)
  assert.equal(resAus.body.estado, "ausente")
})

test("B1-B3 & §11.5: bloqueos hide slots, reject direct bookings with AGENDA_BLOCKED, and never auto-cancel existing turnos", async () => {
  const lunes = proximoDiaSemana(1, 2) // Monday: PROF works 08:00-13:00 & 16:00-20:00

  // Existing turno at 09:00 on that Monday
  const idExistente = await t.insertTurno({
    fecha: lunes,
    hora: "09:00",
    estado: "confirmado",
    profesional: PROF,
    cliente: CLIENTE,
  })

  // Create partial block 08:00-10:00 on PROF
  const crearParcial = await t.api("POST", "/api/admin/bloqueos", {
    as: ACTORES.admin,
    body: {
      fechas: [lunes],
      hora_inicio: "08:00",
      hora_fin: "10:00",
      dni_profesional: PROF,
      motivo: "Ateneo",
    },
  })
  assert.equal(crearParcial.status, 201)
  assert.equal(crearParcial.body.length, 1)
  const idParcial = crearParcial.body[0].id_bloqueo

  // Existing turno at 09:00 is STILL confirmado (not auto-cancelled, PLAN §3.6)
  assert.equal((await t.getTurno(idExistente)).estado, "confirmado")

  // /slots on Monday omits 08:00..09:30, but offers 10:00+
  const slotsParcial = await t.api(
    "GET",
    `/api/profesionales/${PROF}/slots?desde=${lunes}&hasta=${lunes}`,
    { as: ACTORES.cliente },
  )
  assert.equal(slotsParcial.status, 200)
  const listaParcial = slotsParcial.body.dias[0].slots
  assert.ok(!listaParcial.includes("08:30"), "08:30 is inside [08:00, 10:00) block")
  assert.ok(listaParcial.includes("10:00"), "10:00 is outside [08:00, 10:00) block")

  // Direct booking at 08:30 -> 409 AGENDA_BLOCKED
  const reservaBloqueada = await t.api("POST", "/api/turnos", {
    as: ACTORES.cliente,
    body: { dni_profesional: PROF, fecha_turno: lunes, hora_turno: "08:30" },
  })
  assertError(reservaBloqueada, 409, "AGENDA_BLOCKED")

  // Create full-day center-wide block (dni_profesional: null)
  const crearCentro = await t.api("POST", "/api/admin/bloqueos", {
    as: ACTORES.admin,
    body: {
      fechas: [lunes],
      dni_profesional: null,
      motivo: "Feriado nacional",
    },
  })
  assert.equal(crearCentro.status, 201)
  const idCentro = crearCentro.body[0].id_bloqueo

  const slotsCentro = await t.api(
    "GET",
    `/api/profesionales/${PROF}/slots?desde=${lunes}&hasta=${lunes}`,
    { as: ACTORES.cliente },
  )
  assert.deepEqual(slotsCentro.body.dias[0].slots, [])

  // Delete both blocks -> slots are restored
  assert.equal(
    (await t.api("DELETE", `/api/admin/bloqueos/${idParcial}`, { as: ACTORES.admin })).status,
    204,
  )
  assert.equal(
    (await t.api("DELETE", `/api/admin/bloqueos/${idCentro}`, { as: ACTORES.admin })).status,
    204,
  )

  const slotsRestaurados = await t.api(
    "GET",
    `/api/profesionales/${PROF}/slots?desde=${lunes}&hasta=${lunes}`,
    { as: ACTORES.cliente },
  )
  assert.ok(slotsRestaurados.body.dias[0].slots.includes("08:30"))
})
