import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startTestApp, PROF, OTRO_PROF, CLIENTE, CLIENTE_AISLADO } from "./helpers/test-app.js"
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

const ESTADOS = ["pendiente_confirmacion", "confirmado", "en_espera", "en_curso", "completado", "ausente", "reprogramado", "cancelado"]
const ABIERTOS = ["pendiente_confirmacion", "confirmado", "en_espera", "en_curso"]
const yo = { dni: CLIENTE_AISLADO, role: "cliente" }
let ids // estado -> id_turno, one turno per state for the isolated client

async function sembrar() {
  ids = {}
  for (const [i, estado] of ESTADOS.entries()) {
    ids[estado] = await t.insertTurno({ fecha: fechaEnDias(3 + i), hora: "10:00", estado, cliente: CLIENTE_AISLADO, profesional: i % 2 ? PROF : OTRO_PROF })
  }
  // Noise: an open turno of another client must never show up.
  await t.insertTurno({ fecha: fechaEnDias(3), hora: "11:00", estado: "confirmado", cliente: CLIENTE })
}

const listar = (query = "") => t.api("GET", `/api/clientes/${CLIENTE_AISLADO}/turnos${query}`, { as: yo })

test("client list: estado=abiertos returns pendiente_confirmacion, confirmado, en_espera and en_curso, ordered by date", async () => {
  const res = await listar("?estado=abiertos")

  assert.equal(res.status, 200)
  assert.deepEqual(res.body.map((x) => x.id_turno), ABIERTOS.map((e) => ids[e]))
  assert.deepEqual(res.body.map((x) => x.estado), ABIERTOS)
})

test("client list (previous behavior): an exact estado filters exactly, including the renamed confirmado", async () => {
  for (const estado of ["confirmado", "cancelado", "completado", "ausente"]) {
    const res = await listar(`?estado=${estado}`)

    assert.equal(res.status, 200)
    assert.deepEqual(res.body.map((x) => x.id_turno), [ids[estado]])
  }
})

test("client list (previous behavior): without estado returns every turno with the professional data", async () => {
  const res = await listar()

  assert.equal(res.status, 200)
  assert.deepEqual(res.body.map((x) => x.estado), ESTADOS)
  for (const campo of ["apellido", "nombre", "dni", "genero", "foto_url", "especialidades", "id_turno", "fecha_turno", "hora_turno", "estado"]) {
    assert.ok(campo in res.body[0], `missing field ${campo}`)
  }
  assert.equal(res.body[0].dni, OTRO_PROF)
})

test("client list (previous behavior): another cliente's DNI is 403 FORBIDDEN", async () => {
  const res = await t.api("GET", `/api/clientes/${CLIENTE}/turnos?estado=abiertos`, { as: yo })

  assertError(res, 403, "FORBIDDEN")
})

test("client activos: /turnos/activos keeps its URL and returns the open states", async () => {
  const res = await t.api("GET", `/api/clientes/${CLIENTE_AISLADO}/turnos/activos`, { as: yo })

  assert.equal(res.status, 200)
  assert.equal(res.body.success, true)
  assert.deepEqual(res.body.data.map((x) => x.id_turno), ABIERTOS.map((e) => ids[e]))
  for (const campo of ["id_turno", "fecha_turno", "hora_turno", "nombre", "apellido", "foto_url"]) {
    assert.ok(campo in res.body.data[0], `missing field ${campo}`)
  }
})

test("client activos: another cliente is 403 FORBIDDEN and gets no data", async () => {
  // CLIENTE is a logged-in cliente asking for the open turnos of CLIENTE_AISLADO.
  const res = await t.api("GET", `/api/clientes/${CLIENTE_AISLADO}/turnos/activos`, { as: { dni: CLIENTE, role: "cliente" } })

  assertError(res, 403, "FORBIDDEN")
  assert.equal(res.body.message, "No tienes permiso para realizar esta acción")
  assert.equal("data" in res.body, false)
  assert.equal(JSON.stringify(res.body).includes("id_turno"), false, "no turno data leaks")
})

test("client activos (previous behavior): the owner without turnos keeps getting the generic 500", async () => {
  const DNI = 10000003
  await t.pool.query("INSERT INTO persona (dni_persona, nombre, apellido, fecha_nacimiento, genero) VALUES (?, 'Vacio', 'Sin Turnos', '1990-01-01', 'X')", [DNI])
  await t.pool.query("INSERT INTO persona_rol (dni_persona, id_rol, correo, password_hash) VALUES (?, 1, 'vacio@test.dev', 'x')", [DNI])
  await t.pool.query("INSERT INTO cliente (dni_cliente) VALUES (?)", [DNI])

  const res = await t.api("GET", `/api/clientes/${DNI}/turnos/activos`, { as: { dni: DNI, role: "cliente" } })

  assertError(res, 500, "INTERNAL_ERROR")
})
