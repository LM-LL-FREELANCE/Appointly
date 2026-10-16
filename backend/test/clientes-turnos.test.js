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
