import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { startTestApp, PROF, CLIENTE, ADMIN } from "./helpers/test-app.js"
import { assertError } from "./helpers/asserts.js"
import { rangoMesActual } from "../src/utils/time.js"

let t
let origComunicado
let origComunicadoLote

before(async () => {
  t = await startTestApp()
  origComunicado = t.EmailMethods.comunicado
  origComunicadoLote = t.EmailMethods.comunicadoLote
})

after(async () => {
  if (t) {
    t.EmailMethods.comunicado = origComunicado
    t.EmailMethods.comunicadoLote = origComunicadoLote
  }
  await t?.close()
})

beforeEach(async () => {
  await t.pool.query("DELETE FROM email_enviado")
  t.EmailMethods.comunicado = async () => ({ id: "mock-ind" })
  t.EmailMethods.comunicadoLote = async ({ destinatarios }) => ({
    exitos: destinatarios.length,
    fallos: 0,
  })
})

const ACTORES = {
  cliente: { dni: CLIENTE, role: "cliente" },
  admin: { dni: ADMIN, role: "admin" },
}

test("M2: GET /api/admin/comunicaciones/segmentos/:tipo previews active accounts and excludes suspended/deleted", async () => {
  const resProf = await t.api("GET", "/api/admin/comunicaciones/segmentos/profesionales", {
    as: ACTORES.admin,
  })
  assert.equal(resProf.status, 200)
  assert.equal(resProf.body.cantidad, 5)
  assert.ok(Array.isArray(resProf.body.muestra))

  // Suspend one professional -> count drops to 4
  await t.pool.query(
    "UPDATE persona_rol SET suspendido_en = NOW() WHERE dni_persona = ? AND id_rol = 2",
    [PROF],
  )
  try {
    const resLuego = await t.api("GET", "/api/admin/comunicaciones/segmentos/profesionales", {
      as: ACTORES.admin,
    })
    assert.equal(resLuego.status, 200)
    assert.equal(resLuego.body.cantidad, 4)
  } finally {
    await t.pool.query(
      "UPDATE persona_rol SET suspendido_en = NULL WHERE dni_persona = ? AND id_rol = 2",
      [PROF],
    )
  }

  // clientes_turnos_activos requires range
  const sinRango = await t.api(
    "GET",
    "/api/admin/comunicaciones/segmentos/clientes_turnos_activos",
    { as: ACTORES.admin },
  )
  assertError(sinRango, 400, "BAD_REQUEST")

  const { desde, hasta } = rangoMesActual()
  const conRango = await t.api(
    "GET",
    `/api/admin/comunicaciones/segmentos/clientes_turnos_activos?desde=${desde}&hasta=${hasta}`,
    { as: ACTORES.admin },
  )
  assert.equal(conRango.status, 200)
  assert.ok(conRango.body.cantidad > 0)
})

test("M3 & M1: POST /api/admin/comunicaciones/individual sends mail, logs to history, and returns 404 on unknown account", async () => {
  const noExiste = await t.api("POST", "/api/admin/comunicaciones/individual", {
    as: ACTORES.admin,
    body: {
      dni: 99999999,
      rol: "cliente",
      asunto: "Aviso",
      mensaje: "Hola",
    },
  })
  assertError(noExiste, 404, "NOT_FOUND")

  let enviado = null
  t.EmailMethods.comunicado = async (args) => {
    enviado = args
    return { id: "mock-1" }
  }

  const ok = await t.api("POST", "/api/admin/comunicaciones/individual", {
    as: ACTORES.admin,
    body: {
      dni: CLIENTE,
      rol: "cliente",
      asunto: "Recordatorio de documentación",
      mensaje: "Traer estudios previos.",
    },
  })
  assert.equal(ok.status, 201)
  assert.equal(ok.body.exitos, 1)
  assert.equal(ok.body.fallos, 0)
  assert.ok(enviado)
  assert.equal(enviado.asunto, "Recordatorio de documentación")

  const hist = await t.api("GET", "/api/admin/comunicaciones", { as: ACTORES.admin })
  assert.equal(hist.status, 200)
  assert.equal(hist.body.length, 1)
  assert.equal(hist.body[0].tipo, "individual")
  assert.equal(hist.body[0].asunto, "Recordatorio de documentación")
  assert.equal(hist.body[0].cuerpo, "Traer estudios previos.")
})

test("M4: POST /api/admin/comunicaciones/masivo rejects empty segment (422 SEGMENT_EMPTY) and rate limits after 3 sends/hour", async () => {
  // Empty segment (range in 2099 with no turnos) -> 422 SEGMENT_EMPTY (does not consume rate limit before validation? Wait: massMailLimiter runs on POST /masivo, so let's test 3 valid sends first or test SEGMENT_EMPTY)
  const ok1 = await t.api("POST", "/api/admin/comunicaciones/masivo", {
    as: ACTORES.admin,
    body: {
      segmento: "profesionales",
      asunto: "Comunicado 1",
      mensaje: "Mensaje 1",
    },
  })
  assert.equal(ok1.status, 201)
  assert.equal(ok1.body.cantidad, 5)
  assert.equal(ok1.body.exitos, 5)

  // Empty segment -> 422 SEGMENT_EMPTY
  const vacio = await t.api("POST", "/api/admin/comunicaciones/masivo", {
    as: ACTORES.admin,
    body: {
      segmento: "clientes_turnos_activos",
      desde: "2099-01-01",
      hasta: "2099-01-02",
      asunto: "Vacío",
      mensaje: "Sin turnos",
    },
  })
  assertError(vacio, 422, "SEGMENT_EMPTY")

  // 3rd request in the hour succeeds
  const ok3 = await t.api("POST", "/api/admin/comunicaciones/masivo", {
    as: ACTORES.admin,
    body: {
      segmento: "profesionales",
      asunto: "Comunicado 3",
      mensaje: "Mensaje 3",
    },
  })
  assert.equal(ok3.status, 201)

  // 4th request in the hour -> 429 ACTION_RATE_LIMIT_EXCEEDED
  const cuarto = await t.api("POST", "/api/admin/comunicaciones/masivo", {
    as: ACTORES.admin,
    body: {
      segmento: "profesionales",
      asunto: "Comunicado 4",
      mensaje: "Mensaje 4",
    },
  })
  assertError(cuarto, 429, "ACTION_RATE_LIMIT_EXCEEDED")
})
