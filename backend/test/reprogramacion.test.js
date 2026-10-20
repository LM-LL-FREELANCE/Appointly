import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startTestApp, proximoDiaSemana, PROF, OTRO_PROF, PROF_C, CLIENTE, OTRO_CLIENTE, ADMIN } from "./helpers/test-app.js"
import { assertError, assertEvento } from "./helpers/asserts.js"
import { enMinutos, fechaEnDias } from "../src/utils/time.js"

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
  otroProfesional: { dni: OTRO_PROF, role: "profesional" },
  admin: { dni: ADMIN, role: "admin" },
}

// Aguirre (PROF) works Mondays 08:00-13:00 and 16:00-20:00; Fernandez (PROF_C) Mondays 10:00-18:00.
const LUNES = proximoDiaSemana(1, 14)
let semana = 0
/** A free Monday slot nobody else uses: a fresh week per call. */
const slotLibre = (hora = "09:00") => ({ fecha_turno: fechaEnDias(7 * semana++, LUNES), hora_turno: hora })

const original = (extra = {}) => t.insertTurno({ fecha: fechaEnDias(3), hora: "10:00", estado: "confirmado", ...extra })
const reprogramar = (id, actor, body) => t.api("POST", `/api/turnos/${id}/reprogramacion`, { as: ACTORES[actor], body })
const get = (id, actor = "admin") => t.api("GET", `/api/turnos/${id}`, { as: ACTORES[actor] })

const contar = async (tabla) => (await t.pool.query(`SELECT COUNT(*) AS n FROM ${tabla}`))[0][0].n
/** Everything a rejected request must leave untouched. */
const foto = async (id) => ({ turnos: await contar("turno"), eventos: await contar("turno_evento"), original: await t.getTurno(id) })
const assertRechazo = async (id, antes, res, status, code) => {
  assertError(res, status, code)
  assert.deepEqual(await foto(id), antes, "both turnos and the event table must be unchanged")
}

/** Records the emails sent to the patient instead of calling Resend. */
const espiarMail = () => {
  const llamadas = []
  const original = t.EmailMethods.turnoReprogramado
  t.EmailMethods.turnoReprogramado = async (args) => { llamadas.push(args) }
  return { llamadas, restaurar: () => { t.EmailMethods.turnoReprogramado = original } }
}

// --- happy paths -----------------------------------------------------------------------

for (const estado of ["confirmado", "pendiente_confirmacion"]) {
  test(`reprogramacion: the profesional moves a ${estado} turno (original -> reprogramado, new confirmado turno, both events)`, async () => {
    const id = await original({ estado })
    const destino = slotLibre("09:30")
    const mail = espiarMail()

    try {
      const res = await reprogramar(id, "profesional", { ...destino, motivo: "El profesional tiene una urgencia" })

      assert.equal(res.status, 201)
      const idNuevo = res.body.nuevo.id_turno
      assert.notEqual(idNuevo, id)
      assert.equal(res.body.original.id_turno, id)
      assert.equal(res.body.original.estado, "reprogramado")
      assert.equal(res.body.original.id_turno_nuevo, idNuevo)
      assert.equal(res.body.nuevo.estado, "confirmado")
      assert.equal(res.body.nuevo.id_turno_origen, id)
      assert.equal(res.body.nuevo.id_turno_nuevo, null)
      assert.equal(res.body.nuevo.dni_cliente, CLIENTE)
      assert.equal(res.body.nuevo.dni_profesional, PROF)
      // both use the GET /api/turnos/:id shape
      assert.deepEqual(res.body.original, (await get(id)).body)
      assert.deepEqual(res.body.nuevo, (await get(idNuevo)).body)

      assert.equal((await t.getTurno(id)).estado, "reprogramado")
      assert.equal((await t.getTurno(id)).hora_turno, "10:00", "the original keeps its date and time")
      assert.deepEqual(await t.getTurno(idNuevo), {
        id_turno: idNuevo,
        fecha_turno: destino.fecha_turno,
        hora_turno: destino.hora_turno,
        estado: "confirmado",
        dni_profesional: PROF,
        dni_cliente: CLIENTE,
        id_turno_origen: id,
        motivo_cancelacion: null,
        cancelado_en: null,
        completado_en: null,
      })

      const eventosOriginal = await t.getEventos(id)
      assert.equal(eventosOriginal.length, 1)
      assertEvento(eventosOriginal[0], { estado_anterior: estado, estado_nuevo: "reprogramado", dni_actor: PROF, rol_actor: "profesional", motivo: "El profesional tiene una urgencia" })
      const eventosNuevo = await t.getEventos(idNuevo)
      assert.equal(eventosNuevo.length, 1)
      assertEvento(eventosNuevo[0], { estado_anterior: null, estado_nuevo: "confirmado", dni_actor: PROF, rol_actor: "profesional", motivo: "El profesional tiene una urgencia" })

      assert.equal(mail.llamadas.length, 1)
      assert.equal(mail.llamadas[0].motivo, "El profesional tiene una urgencia")
      assert.equal(mail.llamadas[0].original.hora_turno, "10:00:00", "the mail gets the old date and time")
      assert.equal(mail.llamadas[0].nuevo.id_turno, idNuevo)
      assert.equal(mail.llamadas[0].nuevo.c_correo, res.body.nuevo.c_correo)
    } finally {
      mail.restaurar()
    }
  })
}

test("reprogramacion: an ausente turno stays ausente (no state change, no event on it) and gets a linked new turno", async () => {
  const id = await original({ estado: "ausente", fecha: fechaEnDias(-1) })
  const destino = slotLibre("10:00")

  const res = await reprogramar(id, "profesional", destino)

  assert.equal(res.status, 201)
  const idNuevo = res.body.nuevo.id_turno
  assert.equal(res.body.original.estado, "ausente")
  assert.equal(res.body.original.id_turno_nuevo, idNuevo)
  assert.equal(res.body.nuevo.estado, "confirmado")
  assert.equal(res.body.nuevo.id_turno_origen, id)
  assert.equal((await t.getTurno(id)).estado, "ausente")
  assert.deepEqual(await t.getEventos(id), [], "no event on the ausente original")
  const eventosNuevo = await t.getEventos(idNuevo)
  assert.equal(eventosNuevo.length, 1)
  assertEvento(eventosNuevo[0], { estado_anterior: null, estado_nuevo: "confirmado", dni_actor: PROF, rol_actor: "profesional" })
  const fila = await t.getTurno(idNuevo)
  assert.equal(fila.fecha_turno, destino.fecha_turno)
  assert.equal(fila.hora_turno, destino.hora_turno)
  assert.equal(fila.dni_cliente, CLIENTE)
  assert.equal(fila.dni_profesional, PROF)
})

test("reprogramacion: an admin moves the turno of any professional and is the actor of both events", async () => {
  const id = await original({ profesional: PROF_C, cliente: OTRO_CLIENTE })
  const destino = slotLibre("11:00")

  const res = await reprogramar(id, "admin", { ...destino, motivo: "Reorganizacion de agenda" })

  assert.equal(res.status, 201)
  assert.equal(res.body.original.estado, "reprogramado")
  assert.equal(res.body.nuevo.dni_profesional, PROF_C)
  assert.equal(res.body.nuevo.dni_cliente, OTRO_CLIENTE)
  const [eventoOriginal] = await t.getEventos(id)
  assertEvento(eventoOriginal, { estado_anterior: "confirmado", estado_nuevo: "reprogramado", dni_actor: ADMIN, rol_actor: "admin", motivo: "Reorganizacion de agenda" })
  const [eventoNuevo] = await t.getEventos(res.body.nuevo.id_turno)
  assertEvento(eventoNuevo, { estado_anterior: null, estado_nuevo: "confirmado", dni_actor: ADMIN, rol_actor: "admin", motivo: "Reorganizacion de agenda" })
})

test("reprogramacion: motivo is optional, trimmed, and an empty one is stored as NULL", async () => {
  const sin = await original()
  const vacio = await original()
  const conEspacios = await original()

  const r1 = await reprogramar(sin, "profesional", slotLibre())
  const r2 = await reprogramar(vacio, "profesional", { ...slotLibre(), motivo: "   " })
  const r3 = await reprogramar(conEspacios, "profesional", { ...slotLibre(), motivo: "  Se mueve  " })

  for (const r of [r1, r2, r3]) assert.equal(r.status, 201)
  assert.equal((await t.getEventos(sin))[0].motivo, null)
  assert.equal((await t.getEventos(vacio))[0].motivo, null)
  assert.equal((await t.getEventos(r2.body.nuevo.id_turno))[0].motivo, null)
  assert.equal((await t.getEventos(conEspacios))[0].motivo, "Se mueve")
  assert.equal((await t.getEventos(r3.body.nuevo.id_turno))[0].motivo, "Se mueve")
})

test("reprogramacion: the original slot is freed (bookable again) and the new one is occupied", async () => {
  const fechaVieja = LUNES
  const id = await original({ fecha: fechaVieja, hora: "12:00" })
  assert.equal(await t.TurnosModel.existeOcupado({ dni: PROF, fecha: fechaVieja, hora: "12:00" }), true)
  const destino = slotLibre("12:30")

  const res = await reprogramar(id, "profesional", destino)

  assert.equal(res.status, 201)
  assert.equal(await t.TurnosModel.existeOcupado({ dni: PROF, fecha: fechaVieja, hora: "12:00" }), false)
  assert.equal(await t.TurnosModel.existeOcupado({ dni: PROF, fecha: destino.fecha_turno, hora: destino.hora_turno }), true)
  const reservaVieja = await t.api("POST", "/api/turnos", { as: ACTORES.cliente, body: { dni_profesional: PROF, fecha_turno: fechaVieja, hora_turno: "12:00" } })
  assert.equal(reservaVieja.status, 201)
  const reservaNueva = await t.api("POST", "/api/turnos", { as: ACTORES.cliente, body: { dni_profesional: PROF, ...destino } })
  assertError(reservaNueva, 409, "SLOT_TAKEN")
})

test("reprogramacion: an ausente original keeps occupying its own slot", async () => {
  const id = await original({ estado: "ausente", fecha: LUNES, hora: "16:00" })

  const res = await reprogramar(id, "profesional", slotLibre())

  assert.equal(res.status, 201)
  assert.equal(await t.TurnosModel.existeOcupado({ dni: PROF, fecha: LUNES, hora: "16:00" }), true)
})

// --- email -----------------------------------------------------------------------------

test("reprogramacion: a failing email never fails the request and the change stays committed", async () => {
  const id = await original()
  const destino = slotLibre("17:00")
  const mail = espiarMail()
  t.EmailMethods.turnoReprogramado = async () => { throw new Error("Resend caido") }
  const consoleError = console.error
  const errores = []
  console.error = (...args) => errores.push(args)

  try {
    const res = await reprogramar(id, "profesional", destino)
    await new Promise((resolve) => setImmediate(resolve)) // let the fire-and-forget task settle

    assert.equal(res.status, 201)
    assert.equal(res.body.original.estado, "reprogramado")
    assert.equal((await t.getTurno(id)).estado, "reprogramado")
    assert.equal((await t.getTurno(res.body.nuevo.id_turno)).estado, "confirmado")
    assert.equal((await t.getEventos(id)).length, 1)
    assert.equal((await t.getEventos(res.body.nuevo.id_turno)).length, 1)
    assert.ok(errores.length >= 1, "the failure is logged")
  } finally {
    console.error = consoleError
    mail.restaurar()
  }
})

test("reprogramacion: no email is sent when the request is rejected", async () => {
  const id = await original({ estado: "completado" })
  const mail = espiarMail()

  try {
    const res = await reprogramar(id, "profesional", slotLibre())

    assertError(res, 409, "NOT_REPROGRAMMABLE")
    assert.equal(mail.llamadas.length, 0)
  } finally {
    mail.restaurar()
  }
})

// --- authorization ---------------------------------------------------------------------

test("reprogramacion: a cliente (even the owner) is 403 FORBIDDEN and nothing changes", async () => {
  const id = await original()
  const antes = await foto(id)

  await assertRechazo(id, antes, await reprogramar(id, "cliente", slotLibre()), 403, "FORBIDDEN")
})

test("reprogramacion: another profesional is 403 FORBIDDEN and nothing changes", async () => {
  const id = await original()
  const antes = await foto(id)

  await assertRechazo(id, antes, await reprogramar(id, "otroProfesional", slotLibre()), 403, "FORBIDDEN")
})

test("reprogramacion: without a session cookie is 401 UNAUTHORIZED", async () => {
  const id = await original()
  const antes = await foto(id)

  const res = await t.api("POST", `/api/turnos/${id}/reprogramacion`, { body: slotLibre() })

  await assertRechazo(id, antes, res, 401, "UNAUTHORIZED")
})

test("reprogramacion: an unknown turno is 404 NOT_FOUND", async () => {
  assertError(await reprogramar(999999999, "admin", slotLibre()), 404, "NOT_FOUND")
})

// --- origin state ----------------------------------------------------------------------

for (const estado of ["en_espera", "en_curso", "completado", "reprogramado", "cancelado"]) {
  test(`reprogramacion: a ${estado} turno is 409 NOT_REPROGRAMMABLE and nothing changes`, async () => {
    const id = await original({ estado })
    const antes = await foto(id)

    await assertRechazo(id, antes, await reprogramar(id, "profesional", slotLibre()), 409, "NOT_REPROGRAMMABLE")
  })
}

// --- validation (400) ------------------------------------------------------------------

const INVALIDOS = [
  ["fecha_turno is not a date", () => ({ fecha_turno: "manana", hora_turno: "09:00" }), "fecha_turno"],
  ["fecha_turno does not exist in the calendar", () => ({ fecha_turno: "2030-02-30", hora_turno: "09:00" }), "fecha_turno"],
  ["fecha_turno is missing", () => ({ hora_turno: "09:00" }), "fecha_turno"],
  ["hora_turno is not HH:MM", () => ({ fecha_turno: slotLibre().fecha_turno, hora_turno: "9:00" }), "hora_turno"],
  ["hora_turno is out of range", () => ({ fecha_turno: slotLibre().fecha_turno, hora_turno: "25:00" }), "hora_turno"],
  ["hora_turno is missing", () => ({ fecha_turno: slotLibre().fecha_turno }), "hora_turno"],
  ["motivo is longer than 255 characters", () => ({ ...slotLibre(), motivo: "x".repeat(256) }), "motivo"],
  ["fecha_turno is in the past", () => ({ fecha_turno: fechaEnDias(-7), hora_turno: "09:00" }), "fecha_turno"],
  ["fecha_turno is today but the time already started", () => ({ fecha_turno: enMinutos(-5).fecha, hora_turno: enMinutos(-5).hora }), "fecha_turno"],
  ["fecha+hora is exactly the current minute (not strictly future)", () => ({ fecha_turno: enMinutos(0).fecha, hora_turno: enMinutos(0).hora }), "fecha_turno"],
]

for (const [nombre, armar, campo] of INVALIDOS) {
  test(`reprogramacion: ${nombre} is 400 VALIDATION_FAILED on ${campo} and nothing changes`, async () => {
    const id = await original()
    const antes = await foto(id)

    const res = await reprogramar(id, "profesional", armar())

    await assertRechazo(id, antes, res, 400, "VALIDATION_FAILED")
    assert.ok(res.body.fieldErrors[campo], `fieldErrors names ${campo}`)
  })
}

test("reprogramacion: a missing body is 400 VALIDATION_FAILED", async () => {
  const id = await original()
  const antes = await foto(id)

  await assertRechazo(id, antes, await t.api("POST", `/api/turnos/${id}/reprogramacion`, { as: ACTORES.profesional }), 400, "VALIDATION_FAILED")
})

// --- schedule and slot -----------------------------------------------------------------

test("reprogramacion: a day without schedule is 409 OUT_OF_SCHEDULE and nothing changes", async () => {
  const id = await original()
  const antes = await foto(id)
  const martes = proximoDiaSemana(2, 14)

  await assertRechazo(id, antes, await reprogramar(id, "profesional", { fecha_turno: martes, hora_turno: "09:00" }), 409, "OUT_OF_SCHEDULE")
})

test("reprogramacion: a time outside the working hours of that day is 409 OUT_OF_SCHEDULE", async () => {
  const id = await original()
  const antes = await foto(id)

  await assertRechazo(id, antes, await reprogramar(id, "profesional", { fecha_turno: LUNES, hora_turno: "14:00" }), 409, "OUT_OF_SCHEDULE")
})

test("reprogramacion: the schedule checked is the one of the turno's professional, not the actor's (admin)", async () => {
  const id = await original({ profesional: OTRO_PROF }) // Vega: Tue/Thu/Fri only
  const antes = await foto(id)

  await assertRechazo(id, antes, await reprogramar(id, "admin", { fecha_turno: LUNES, hora_turno: "09:00" }), 409, "OUT_OF_SCHEDULE")
})

for (const estado of ["confirmado", "pendiente_confirmacion", "en_espera", "en_curso", "completado", "ausente"]) {
  test(`reprogramacion: a slot held by another ${estado} turno is 409 SLOT_TAKEN and nothing changes`, async () => {
    const destino = slotLibre("08:30")
    await t.insertTurno({ fecha: destino.fecha_turno, hora: destino.hora_turno, estado, cliente: OTRO_CLIENTE })
    const id = await original()
    const antes = await foto(id)

    await assertRechazo(id, antes, await reprogramar(id, "profesional", destino), 409, "SLOT_TAKEN")
  })
}

test("reprogramacion: a slot freed by a cancelado or reprogramado turno can be taken", async () => {
  const destino = slotLibre("08:00")
  await t.insertTurno({ fecha: destino.fecha_turno, hora: destino.hora_turno, estado: "cancelado", cliente: OTRO_CLIENTE })
  await t.insertTurno({ fecha: destino.fecha_turno, hora: destino.hora_turno, estado: "reprogramado", cliente: OTRO_CLIENTE })
  const id = await original()

  const res = await reprogramar(id, "profesional", destino)

  assert.equal(res.status, 201)
})

test("reprogramacion: the same date and time as the original is 409 SLOT_TAKEN (the original still holds it)", async () => {
  const id = await original({ fecha: LUNES, hora: "11:30" })
  const antes = await foto(id)

  await assertRechazo(id, antes, await reprogramar(id, "profesional", { fecha_turno: LUNES, hora_turno: "11:30" }), 409, "SLOT_TAKEN")
})

// --- ausente already reprogrammed -----------------------------------------------------

test("reprogramacion: a second attempt on an ausente turno is 409 ALREADY_REPROGRAMMED and nothing changes", async () => {
  const id = await original({ estado: "ausente", fecha: fechaEnDias(-1) })
  const primero = await reprogramar(id, "profesional", slotLibre("09:00"))
  assert.equal(primero.status, 201)
  const antes = await foto(id)

  const res = await reprogramar(id, "profesional", slotLibre("10:00"))

  await assertRechazo(id, antes, res, 409, "ALREADY_REPROGRAMMED")
  assert.equal(res.body.message, "El turno ausente ya fue reprogramado.")
  assert.deepEqual(await t.getEventos(id), [], "still no event on the ausente original")
  const [[{ n }]] = await t.pool.query("SELECT COUNT(*) AS n FROM turno WHERE id_turno_origen = ?", [id])
  assert.equal(n, 1, "only the first successor exists")
})

test("reprogramacion: ALREADY_REPROGRAMMED wins over SLOT_TAKEN when retrying the successor's own slot", async () => {
  const id = await original({ estado: "ausente", fecha: fechaEnDias(-1) })
  const destino = slotLibre("11:00")
  assert.equal((await reprogramar(id, "profesional", destino)).status, 201)
  const antes = await foto(id)

  await assertRechazo(id, antes, await reprogramar(id, "admin", destino), 409, "ALREADY_REPROGRAMMED")
})

for (const estado of ["pendiente_confirmacion", "confirmado", "en_espera", "en_curso", "completado", "ausente"]) {
  test(`reprogramacion: an ausente turno whose successor is ${estado} is 409 ALREADY_REPROGRAMMED`, async () => {
    const id = await original({ estado: "ausente", fecha: fechaEnDias(-1) })
    await t.insertTurno({ fecha: slotLibre("12:00").fecha_turno, hora: "12:00", estado, origen: id })
    const antes = await foto(id)

    await assertRechazo(id, antes, await reprogramar(id, "profesional", slotLibre("12:30")), 409, "ALREADY_REPROGRAMMED")
  })
}

for (const estado of ["cancelado", "reprogramado"]) {
  test(`reprogramacion: an ausente turno whose successor was ${estado} can be reprogrammed again`, async () => {
    const id = await original({ estado: "ausente", fecha: fechaEnDias(-1) })
    const primero = await t.insertTurno({ fecha: slotLibre("12:00").fecha_turno, hora: "12:00", estado, origen: id })
    const destino = slotLibre("12:30")

    const res = await reprogramar(id, "profesional", destino)

    assert.equal(res.status, 201)
    assert.equal(res.body.original.estado, "ausente")
    assert.equal(res.body.original.id_turno_nuevo, res.body.nuevo.id_turno, "id_turno_nuevo points at the latest successor")
    assert.notEqual(res.body.nuevo.id_turno, primero)
    assert.equal(res.body.nuevo.id_turno_origen, id)
  })
}

test("reprogramacion: an ausente turno can be reprogrammed again after its successor is cancelled through the API", async () => {
  const id = await original({ estado: "ausente", fecha: fechaEnDias(-1) })
  const primero = await reprogramar(id, "profesional", slotLibre("12:00"))
  assert.equal(primero.status, 201)
  const cancelado = await t.api("POST", `/api/turnos/${primero.body.nuevo.id_turno}/cancelacion`, { as: ACTORES.profesional })
  assert.equal(cancelado.status, 200)

  const segundo = await reprogramar(id, "profesional", slotLibre("12:30"))

  assert.equal(segundo.status, 201)
  assert.equal(segundo.body.nuevo.id_turno_origen, id)
  assert.deepEqual(await t.getEventos(id), [])
})

test("reprogramacion: a concurrent double submit on an ausente turno -> exactly one 201, the other ALREADY_REPROGRAMMED", async () => {
  for (let ronda = 0; ronda < 5; ronda++) {
    const id = await original({ estado: "ausente", fecha: fechaEnDias(-1) })
    const antes = { turnos: await contar("turno"), eventos: await contar("turno_evento") }

    // Different free slots, so only the ALREADY_REPROGRAMMED rule can reject the loser.
    const [ra, rb] = await Promise.all([
      reprogramar(id, "profesional", slotLibre("17:30")),
      reprogramar(id, "profesional", slotLibre("18:00")),
    ])

    const ganador = [ra, rb].find((r) => r.status === 201)
    const perdedor = [ra, rb].find((r) => r.status !== 201)
    assert.ok(ganador && perdedor, `round ${ronda}: statuses ${ra.status}/${rb.status}`)
    assertError(perdedor, 409, "ALREADY_REPROGRAMMED")
    const [[{ n }]] = await t.pool.query("SELECT COUNT(*) AS n FROM turno WHERE id_turno_origen = ?", [id])
    assert.equal(n, 1, "a single successor")
    assert.equal((await t.getTurno(id)).estado, "ausente")
    assert.equal(await contar("turno"), antes.turnos + 1)
    assert.equal(await contar("turno_evento"), antes.eventos + 1, "only the successor's initial event")
  }
})

// --- concurrency -----------------------------------------------------------------------

test("reprogramacion: two simultaneous reprogramaciones to the same free slot -> exactly one wins, the other is SLOT_TAKEN", async () => {
  for (let ronda = 0; ronda < 5; ronda++) {
    const destino = slotLibre("19:00")
    const a = await original({ cliente: CLIENTE })
    const b = await original({ cliente: OTRO_CLIENTE })
    const antes = { turnos: await contar("turno"), eventos: await contar("turno_evento") }

    const [ra, rb] = await Promise.all([reprogramar(a, "profesional", destino), reprogramar(b, "profesional", destino)])

    const ganador = [ra, rb].find((r) => r.status === 201)
    const perdedor = [ra, rb].find((r) => r.status !== 201)
    assert.ok(ganador && perdedor, `round ${ronda}: statuses ${ra.status}/${rb.status}`)
    assertError(perdedor, 409, "SLOT_TAKEN")

    const [idGanador, idPerdedor] = ganador === ra ? [a, b] : [b, a]
    assert.equal((await t.getTurno(idGanador)).estado, "reprogramado")
    assert.equal((await t.getTurno(idPerdedor)).estado, "confirmado", "the loser's original is untouched")
    assert.deepEqual(await t.getEventos(idPerdedor), [])
    const [[{ n }]] = await t.pool.query(
      "SELECT COUNT(*) AS n FROM turno WHERE dni_profesional = ? AND fecha_turno = ? AND hora_turno = ? AND estado = 'confirmado'",
      [PROF, destino.fecha_turno, destino.hora_turno],
    )
    assert.equal(n, 1, "exactly one turno holds the slot")
    assert.equal(await contar("turno"), antes.turnos + 1)
    assert.equal(await contar("turno_evento"), antes.eventos + 2, "only the winner wrote events (original + new)")
  }
})

// --- regression: previous endpoints still behave as before ------------------------------

test("regression: crear, PATCH estado and cancel still work after adding reprogramacion", async () => {
  const destino = slotLibre("18:00")
  const creado = await t.api("POST", "/api/turnos", { as: ACTORES.cliente, body: { dni_profesional: PROF, ...destino } })
  assert.equal(creado.status, 201)
  assert.equal(creado.body.data.estado, "confirmado")
  assert.equal(creado.body.data.id_turno_origen, null)

  const hoy = await original({ fecha: enMinutos(0).fecha, hora: "23:59" })
  const patch = await t.api("PATCH", `/api/turnos/${hoy}/estado`, { as: ACTORES.profesional, body: { estado: "en_curso" } })
  assert.equal(patch.status, 200)
  assert.equal(patch.body.estado, "en_curso")

  const cancelado = await t.api("POST", `/api/turnos/${creado.body.data.id_turno}/cancelacion`, { as: ACTORES.cliente, body: { motivo: "Ya no puedo" } })
  assert.equal(cancelado.status, 200)
  assert.equal(cancelado.body.estado, "cancelado")
  assert.equal(cancelado.body.cancelado_por_rol, "cliente")
  const eventos = await t.getEventos(creado.body.data.id_turno)
  assert.deepEqual(eventos.map((e) => [e.estado_anterior, e.estado_nuevo]), [[null, "confirmado"], ["confirmado", "cancelado"]])
})
