import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startTestApp, PROF, OTRO_PROF, CLIENTE, OTRO_CLIENTE, ADMIN } from "./helpers/test-app.js"
import { assertError, assertEvento } from "./helpers/asserts.js"
import { ahoraEnTimezone, enMinutos, fechaEnDias } from "../src/utils/time.js"

let t

before(async () => {
  t = await startTestApp()
})
after(async () => {
  await t?.close()
})

const ACTORES = {
  cliente: { dni: CLIENTE, role: "cliente" },
  otroCliente: { dni: OTRO_CLIENTE, role: "cliente" },
  profesional: { dni: PROF, role: "profesional" },
  otroProfesional: { dni: OTRO_PROF, role: "profesional" },
  admin: { dni: ADMIN, role: "admin" },
}

// Turno date/time scenarios (always evaluated "now", in TIMEZONE).
const hoyTarde = () => ({ fecha: ahoraEnTimezone().fecha, hora: "23:59" }) // today, not started yet
const comenzado = () => enMinutos(-5) // started five minutes ago
const manana = () => ({ fecha: fechaEnDias(1), hora: "12:00" })
const ayer = () => ({ fecha: fechaEnDias(-1), hora: "12:00" })

// A date/time that satisfies the time rule of each destination state.
const CUANDO = { confirmado: manana, en_espera: hoyTarde, en_curso: hoyTarde, ausente: comenzado, completado: comenzado }

const patchEstado = (id, actor, body) => t.api("PATCH", `/api/turnos/${id}/estado`, { as: ACTORES[actor], body })

const assertSinCambios = async (id, estado) => {
  assert.equal((await t.getTurno(id)).estado, estado, "estado must be unchanged")
  assert.deepEqual(await t.getEventos(id), [], "no event must be written")
}

// --- allowed transitions: every row of the matrix, with its role ----------------------

const PERMITIDAS = [
  ["pendiente_confirmacion", "confirmado", "cliente"],
  ["pendiente_confirmacion", "confirmado", "profesional"],
  ["pendiente_confirmacion", "confirmado", "admin"],
  ["confirmado", "en_espera", "profesional"],
  ["confirmado", "en_espera", "admin"],
  ["confirmado", "en_curso", "profesional"],
  ["en_espera", "en_curso", "profesional"],
  ["confirmado", "ausente", "profesional"],
  ["en_espera", "ausente", "profesional"],
  ["en_curso", "completado", "profesional"],
  ["confirmado", "completado", "profesional"],
  ["en_espera", "completado", "profesional"],
]

for (const [origen, nuevo, actor] of PERMITIDAS) {
  test(`PATCH estado: ${origen} -> ${nuevo} as ${actor} returns the turno and writes the event`, async () => {
    const id = await t.insertTurno({ ...CUANDO[nuevo](), estado: origen })

    const res = await patchEstado(id, actor, { estado: nuevo })

    assert.equal(res.status, 200)
    assert.equal(res.body.id_turno, id)
    assert.equal(res.body.estado, nuevo)
    assert.equal(res.body.dni_cliente, CLIENTE)
    assert.equal(res.body.dni_profesional, PROF)

    const fila = await t.getTurno(id)
    assert.equal(fila.estado, nuevo)
    assert.equal(fila.completado_en !== null, nuevo === "completado", "completado_en is set only when completing")

    const eventos = await t.getEventos(id)
    assert.equal(eventos.length, 1)
    assertEvento(eventos[0], {
      estado_anterior: origen,
      estado_nuevo: nuevo,
      dni_actor: ACTORES[actor].dni,
      rol_actor: ACTORES[actor].role,
    })
  })
}

test("PATCH estado: the optional motivo is stored in the event", async () => {
  const id = await t.insertTurno({ ...comenzado(), estado: "confirmado" })

  const res = await patchEstado(id, "profesional", { estado: "ausente", motivo: "No respondio el llamado" })

  assert.equal(res.status, 200)
  assert.equal(res.body.estado, "ausente")
  const [evento] = await t.getEventos(id)
  assertEvento(evento, {
    estado_anterior: "confirmado",
    estado_nuevo: "ausente",
    dni_actor: PROF,
    rol_actor: "profesional",
    motivo: "No respondio el llamado",
  })
})

test("PATCH estado: the response has the same shape and content as GET /api/turnos/:id", async () => {
  const id = await t.insertTurno({ ...hoyTarde(), estado: "confirmado" })

  const patch = await patchEstado(id, "profesional", { estado: "en_curso" })
  const get = await t.api("GET", `/api/turnos/${id}`, { as: ACTORES.profesional })

  assert.equal(patch.status, 200)
  assert.deepEqual(patch.body, get.body)
  assert.equal(get.body.id_turno, id)
  assert.equal(get.body.id_turno_origen, null)
  assert.equal(get.body.id_turno_nuevo, null)
  assert.equal(get.body.cancelado_por_rol, null)
  assert.equal(get.body.cancelado_por_dni, null)
})

test("PATCH estado: en_curso -> completado has no time rule (a future date is accepted)", async () => {
  const id = await t.insertTurno({ ...manana(), estado: "en_curso" })

  const res = await patchEstado(id, "profesional", { estado: "completado" })

  assert.equal(res.status, 200)
  assert.equal(res.body.estado, "completado")
})

test("PATCH estado: ausente is accepted exactly at the start minute of the turno", async () => {
  const id = await t.insertTurno({ ...enMinutos(0), estado: "confirmado" })

  const res = await patchEstado(id, "profesional", { estado: "ausente" })

  assert.equal(res.status, 200)
  assert.equal(res.body.estado, "ausente")
})

// --- forbidden: role not allowed for the transition, or not part of the turno ----------

const PROHIBIDAS = [
  ["pendiente_confirmacion", "confirmado", "otroCliente"], // another client
  ["pendiente_confirmacion", "confirmado", "otroProfesional"], // another professional
  ["confirmado", "en_espera", "cliente"],
  ["confirmado", "en_espera", "otroProfesional"],
  ["confirmado", "en_curso", "cliente"],
  ["confirmado", "en_curso", "admin"], // only the professional starts the atencion
  ["en_espera", "en_curso", "admin"],
  ["en_espera", "en_curso", "otroProfesional"],
  ["confirmado", "ausente", "cliente"],
  ["confirmado", "ausente", "admin"],
  ["en_espera", "ausente", "otroProfesional"],
  ["en_curso", "completado", "cliente"],
  ["en_curso", "completado", "admin"],
  ["confirmado", "completado", "admin"],
  ["en_espera", "completado", "cliente"],
]

for (const [origen, nuevo, actor] of PROHIBIDAS) {
  test(`PATCH estado: ${origen} -> ${nuevo} as ${actor} is 403 FORBIDDEN and changes nothing`, async () => {
    const id = await t.insertTurno({ ...CUANDO[nuevo](), estado: origen })

    const res = await patchEstado(id, actor, { estado: nuevo })

    assertError(res, 403, "FORBIDDEN")
    await assertSinCambios(id, origen)
  })
}

// --- INVALID_TRANSITION ----------------------------------------------------------------

const INVALIDAS = [
  ["completado", "en_curso", "profesional"],
  ["cancelado", "confirmado", "admin"],
  ["confirmado", "confirmado", "profesional"],
  ["pendiente_confirmacion", "en_curso", "profesional"],
  ["pendiente_confirmacion", "completado", "profesional"],
  ["en_curso", "ausente", "profesional"],
  ["en_curso", "en_espera", "profesional"],
  ["en_espera", "en_espera", "profesional"],
  ["ausente", "completado", "profesional"],
  ["reprogramado", "confirmado", "admin"],
]

for (const [origen, nuevo, actor] of INVALIDAS) {
  test(`PATCH estado: ${origen} -> ${nuevo} is 409 INVALID_TRANSITION and changes nothing`, async () => {
    const id = await t.insertTurno({ ...hoyTarde(), estado: origen })

    const res = await patchEstado(id, actor, { estado: nuevo })

    assertError(res, 409, "INVALID_TRANSITION")
    await assertSinCambios(id, origen)
  })
}

// --- TOO_EARLY -------------------------------------------------------------------------

const DEMASIADO_TEMPRANO = [
  ["en_espera: turno tomorrow", "confirmado", "en_espera", manana],
  ["en_curso: turno tomorrow", "confirmado", "en_curso", manana],
  ["en_curso: turno yesterday (not today)", "confirmado", "en_curso", ayer],
  ["en_curso from en_espera: turno tomorrow", "en_espera", "en_curso", manana],
  ["ausente: turno tomorrow", "confirmado", "ausente", manana],
  ["ausente: turno starts in two minutes", "confirmado", "ausente", () => enMinutos(2)],
  ["ausente from en_espera: turno tomorrow", "en_espera", "ausente", manana],
  ["completado from confirmado: turno tomorrow", "confirmado", "completado", manana],
  ["completado from en_espera: turno tomorrow", "en_espera", "completado", manana],
]

for (const [nombre, origen, nuevo, cuando] of DEMASIADO_TEMPRANO) {
  test(`PATCH estado: ${nombre} is 409 TOO_EARLY and changes nothing`, async () => {
    const id = await t.insertTurno({ ...cuando(), estado: origen })

    const res = await patchEstado(id, "profesional", { estado: nuevo })

    assertError(res, 409, "TOO_EARLY")
    await assertSinCambios(id, origen)
  })
}

// --- STATE_CHANGED ---------------------------------------------------------------------

test("PATCH estado: a concurrent change after the read is 409 STATE_CHANGED and writes no event", async () => {
  const id = await t.insertTurno({ ...hoyTarde(), estado: "confirmado" })
  const original = t.TurnosModel.getTurnoById
  let interferido = false
  // Simulates another request cancelling the turno right after this one read it.
  t.TurnosModel.getTurnoById = async function (...args) {
    const turno = await original.apply(this, args)
    if (!interferido) {
      interferido = true
      await t.pool.query("UPDATE turno SET estado = 'cancelado' WHERE id_turno = ?", [id])
    }
    return turno
  }

  try {
    const res = await patchEstado(id, "profesional", { estado: "en_curso" })

    assertError(res, 409, "STATE_CHANGED")
    assert.equal(interferido, true)
    assert.equal((await t.getTurno(id)).estado, "cancelado", "the concurrent change wins")
    assert.deepEqual(await t.getEventos(id), [])
  } finally {
    t.TurnosModel.getTurnoById = original
  }
})

// --- validation, 404, 401 --------------------------------------------------------------

for (const estado of ["cancelado", "reprogramado", "pendiente_confirmacion", "activo", "inventado", undefined, 7]) {
  test(`PATCH estado: estado ${JSON.stringify(estado)} is outside the settable set (400 VALIDATION_FAILED)`, async () => {
    const id = await t.insertTurno({ ...hoyTarde(), estado: "confirmado" })

    const res = await patchEstado(id, "profesional", { estado })

    assertError(res, 400, "VALIDATION_FAILED")
    assert.ok(res.body.fieldErrors.estado, "fieldErrors names the estado field")
    await assertSinCambios(id, "confirmado")
  })
}

test("PATCH estado: a motivo longer than 255 characters is 400 VALIDATION_FAILED", async () => {
  const id = await t.insertTurno({ ...comenzado(), estado: "confirmado" })

  const res = await patchEstado(id, "profesional", { estado: "ausente", motivo: "x".repeat(256) })

  assertError(res, 400, "VALIDATION_FAILED")
  assert.ok(res.body.fieldErrors.motivo)
  await assertSinCambios(id, "confirmado")
})

test("PATCH estado: a missing body is 400 VALIDATION_FAILED", async () => {
  const id = await t.insertTurno({ ...hoyTarde(), estado: "confirmado" })

  const res = await t.api("PATCH", `/api/turnos/${id}/estado`, { as: ACTORES.profesional })

  assertError(res, 400, "VALIDATION_FAILED")
  await assertSinCambios(id, "confirmado")
})

test("PATCH estado: an unknown turno is 404 NOT_FOUND", async () => {
  const res = await patchEstado(999999999, "profesional", { estado: "en_curso" })

  assertError(res, 404, "NOT_FOUND")
})

test("PATCH estado: without a session cookie is 401 UNAUTHORIZED", async () => {
  const id = await t.insertTurno({ ...hoyTarde(), estado: "confirmado" })

  const res = await t.api("PATCH", `/api/turnos/${id}/estado`, { body: { estado: "en_curso" } })

  assertError(res, 401, "UNAUTHORIZED")
  await assertSinCambios(id, "confirmado")
})
