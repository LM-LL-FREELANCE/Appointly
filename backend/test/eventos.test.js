import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startTestApp, proximoDiaSemana, PROF, OTRO_PROF, PROF_C, PROF_D, CLIENTE, OTRO_CLIENTE, ADMIN } from "./helpers/test-app.js"
import { assertError } from "./helpers/asserts.js"
import { fechaEnDias } from "../src/utils/time.js"

let t

before(async () => {
  t = await startTestApp()
  await sembrar()
})
after(async () => {
  await t?.close()
})

const ACTORES = {
  cliente: { dni: CLIENTE, role: "cliente" },
  profesional: { dni: PROF, role: "profesional" },
  otroProfesional: { dni: OTRO_PROF, role: "profesional" },
  profD: { dni: PROF_D, role: "profesional" },
  admin: { dni: ADMIN, role: "admin" },
}

const persona = async (dni) => {
  const [[row]] = await t.pool.query("SELECT nombre, apellido FROM persona WHERE dni_persona = ?", [dni])
  return row
}
const comoJson = (valor) => JSON.parse(JSON.stringify(valor))

// --- GET /api/turnos/:id/eventos ---------------------------------------------------------

test("eventos of a turno: the owner profesional gets them in chronological order with the actor name", async () => {
  const id = await t.insertTurno({ fecha: fechaEnDias(4), estado: "en_curso" })
  // Inserted out of chronological order on purpose: the endpoint must sort by creado_en.
  const e2 = await t.insertEvento({ id_turno: id, estado_anterior: "confirmado", estado_nuevo: "en_curso", dni_actor: PROF, rol_actor: "profesional", motivo: "Llego puntual", creado_en: "2026-03-01 12:00:00" })
  const e1 = await t.insertEvento({ id_turno: id, estado_nuevo: "confirmado", dni_actor: CLIENTE, rol_actor: "cliente", creado_en: "2026-03-01 09:00:00" })
  const e3 = await t.insertEvento({ id_turno: id, estado_anterior: "en_curso", estado_nuevo: "completado", dni_actor: null, rol_actor: null, creado_en: "2026-03-02 09:00:00" })
  const cliente = await persona(CLIENTE)
  const prof = await persona(PROF)

  const res = await t.api("GET", `/api/turnos/${id}/eventos`, { as: ACTORES.profesional })

  assert.equal(res.status, 200)
  assert.deepEqual(res.body.map((e) => { const copia = { ...e }; delete copia.creado_en; return copia }), [
    { id_evento: e1, estado_anterior: null, estado_nuevo: "confirmado", dni_actor: CLIENTE, rol_actor: "cliente", actor_nombre: cliente.nombre, actor_apellido: cliente.apellido, motivo: null },
    { id_evento: e2, estado_anterior: "confirmado", estado_nuevo: "en_curso", dni_actor: PROF, rol_actor: "profesional", actor_nombre: prof.nombre, actor_apellido: prof.apellido, motivo: "Llego puntual" },
    { id_evento: e3, estado_anterior: "en_curso", estado_nuevo: "completado", dni_actor: null, rol_actor: null, actor_nombre: null, actor_apellido: null, motivo: null },
  ])
  for (const e of res.body) assert.ok(!Number.isNaN(Date.parse(e.creado_en)), "creado_en is a date")
  assert.ok(Date.parse(res.body[0].creado_en) < Date.parse(res.body[1].creado_en))
  assert.ok(Date.parse(res.body[1].creado_en) < Date.parse(res.body[2].creado_en))
})

test("eventos of a turno: an admin reads them", async () => {
  const id = await t.insertTurno({ fecha: fechaEnDias(4) })
  await t.insertEvento({ id_turno: id, estado_nuevo: "confirmado", dni_actor: ADMIN, rol_actor: "admin" })

  const res = await t.api("GET", `/api/turnos/${id}/eventos`, { as: ACTORES.admin })

  assert.equal(res.status, 200)
  assert.equal(res.body.length, 1)
  assert.equal(res.body[0].actor_nombre, "Ada")
  assert.equal(res.body[0].rol_actor, "admin")
})

test("eventos of a turno: the cliente, even the owner, is 403 FORBIDDEN", async () => {
  const id = await t.insertTurno({ fecha: fechaEnDias(4) })

  assertError(await t.api("GET", `/api/turnos/${id}/eventos`, { as: ACTORES.cliente }), 403, "FORBIDDEN")
})

test("eventos of a turno: another profesional is 403 FORBIDDEN", async () => {
  const id = await t.insertTurno({ fecha: fechaEnDias(4) })

  assertError(await t.api("GET", `/api/turnos/${id}/eventos`, { as: ACTORES.otroProfesional }), 403, "FORBIDDEN")
})

test("eventos of a turno: an unknown turno is 404 NOT_FOUND", async () => {
  assertError(await t.api("GET", "/api/turnos/999999999/eventos", { as: ACTORES.admin }), 404, "NOT_FOUND")
})

test("eventos of a turno: reflect the real flow (book, then cancel) with each actor", async () => {
  const fecha = proximoDiaSemana(1, 40)
  const creado = await t.api("POST", "/api/turnos", { as: ACTORES.cliente, body: { dni_profesional: PROF, fecha_turno: fecha, hora_turno: "09:00" } })
  assert.equal(creado.status, 201)
  const id = creado.body.data.id_turno
  const cancelado = await t.api("POST", `/api/turnos/${id}/cancelacion`, { as: ACTORES.profesional, body: { motivo: "Licencia" } })
  assert.equal(cancelado.status, 200)

  const res = await t.api("GET", `/api/turnos/${id}/eventos`, { as: ACTORES.admin })

  assert.equal(res.status, 200)
  assert.deepEqual(res.body.map((e) => [e.estado_anterior, e.estado_nuevo, e.dni_actor, e.rol_actor, e.motivo]), [
    [null, "confirmado", CLIENTE, "cliente", null],
    ["confirmado", "cancelado", PROF, "profesional", "Licencia"],
  ])
})

// --- GET /api/turnos/eventos?profesional= ------------------------------------------------

let tA, tB, eventosD

async function sembrar() {
  tA = await t.insertTurno({ fecha: fechaEnDias(5), hora: "10:00", profesional: PROF_D, cliente: CLIENTE })
  tB = await t.insertTurno({ fecha: fechaEnDias(10), hora: "15:30", profesional: PROF_D, cliente: OTRO_CLIENTE })
  eventosD = [
    await t.insertEvento({ id_turno: tA, estado_nuevo: "confirmado", dni_actor: CLIENTE, rol_actor: "cliente", creado_en: "2026-05-01 10:00:00" }),
    await t.insertEvento({ id_turno: tB, estado_nuevo: "confirmado", dni_actor: OTRO_CLIENTE, rol_actor: "cliente", creado_en: "2026-05-02 10:00:00" }),
    await t.insertEvento({ id_turno: tA, estado_anterior: "confirmado", estado_nuevo: "cancelado", dni_actor: ADMIN, rol_actor: "admin", motivo: "Cierre", creado_en: "2026-05-03 10:00:00" }),
  ]
}

const eventos = (actor, query) => t.api("GET", `/api/turnos/eventos?${new URLSearchParams(query)}`, { as: ACTORES[actor] })

test("eventos by profesional: the profesional gets their own, newest first, with turno and patient data", async () => {
  const res = await eventos("profD", { profesional: PROF_D })

  assert.equal(res.status, 200)
  assert.deepEqual(res.body.map((e) => e.id_evento), [eventosD[2], eventosD[1], eventosD[0]])
  const [ultimo] = res.body
  const cliente = await persona(CLIENTE)
  const [[turnoA]] = await t.pool.query("SELECT fecha_turno FROM turno WHERE id_turno = ?", [tA])
  assert.equal(ultimo.estado_anterior, "confirmado")
  assert.equal(ultimo.estado_nuevo, "cancelado")
  assert.equal(ultimo.dni_actor, ADMIN)
  assert.equal(ultimo.rol_actor, "admin")
  assert.equal(ultimo.motivo, "Cierre")
  assert.ok(!Number.isNaN(Date.parse(ultimo.creado_en)))
  assert.equal(ultimo.fecha_turno, comoJson(turnoA.fecha_turno))
  assert.equal(ultimo.hora_turno, "10:00:00")
  assert.equal(ultimo.nombre, cliente.nombre)
  assert.equal(ultimo.apellido, cliente.apellido)
  assert.equal(res.body[1].hora_turno, "15:30:00")
})

test("eventos by profesional: desde/hasta filter by the date of the turno", async () => {
  const res = await eventos("profD", { profesional: PROF_D, desde: fechaEnDias(8), hasta: fechaEnDias(12) })

  assert.equal(res.status, 200)
  assert.deepEqual(res.body.map((e) => e.id_evento), [eventosD[1]])
})

test("eventos by profesional: an admin reads any professional", async () => {
  const res = await eventos("admin", { profesional: PROF_D })

  assert.equal(res.status, 200)
  assert.equal(res.body.length, 3)
})

test("eventos by profesional: a profesional asking for another is 403 FORBIDDEN", async () => {
  assertError(await eventos("profD", { profesional: OTRO_PROF }), 403, "FORBIDDEN")
})

test("eventos by profesional: a cliente is 403 FORBIDDEN", async () => {
  assertError(await eventos("cliente", { profesional: PROF_D }), 403, "FORBIDDEN")
})

test("eventos by profesional: missing or invalid parameters are 400 VALIDATION_FAILED", async () => {
  assertError(await eventos("admin", {}), 400, "VALIDATION_FAILED")
  assertError(await eventos("admin", { profesional: "abc" }), 400, "VALIDATION_FAILED")
  assertError(await eventos("admin", { profesional: PROF_D, desde: "2026-13-45" }), 400, "VALIDATION_FAILED")
  assertError(await eventos("admin", { profesional: PROF_D, desde: "2026-06-10", hasta: "2026-06-01" }), 400, "VALIDATION_FAILED")
})

test("eventos by profesional: returns at most 200 rows, the most recent ones", async () => {
  const id = await t.insertTurno({ fecha: fechaEnDias(6), profesional: OTRO_PROF })
  const ids = []
  for (let i = 0; i < 205; i++) {
    const segundo = String(i % 60).padStart(2, "0")
    const minuto = String(Math.floor(i / 60)).padStart(2, "0")
    ids.push(await t.insertEvento({ id_turno: id, estado_nuevo: "confirmado", dni_actor: OTRO_PROF, rol_actor: "profesional", creado_en: `2026-04-01 00:${minuto}:${segundo}` }))
  }

  const res = await eventos("admin", { profesional: OTRO_PROF })

  assert.equal(res.status, 200)
  assert.equal(res.body.length, 200)
  assert.equal(res.body[0].id_evento, ids[204])
  assert.equal(res.body[199].id_evento, ids[5])
  assert.equal(res.body.some((e) => ids.slice(0, 5).includes(e.id_evento)), false)
})

test("eventos by profesional: a professional without events gets an empty list", async () => {
  const res = await eventos("admin", { profesional: PROF_C })

  assert.equal(res.status, 200)
  assert.deepEqual(res.body, [])
})
