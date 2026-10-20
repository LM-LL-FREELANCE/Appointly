import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startTestApp, ADMIN } from "./helpers/test-app.js"
import { assertError } from "./helpers/asserts.js"
import { fechaEnDias } from "../src/utils/time.js"

// WS3 — configuración general y avisos (PLAN_ADMIN.md §8.2 C1–C7).

let t

before(async () => {
  t = await startTestApp()
})
after(async () => {
  await t?.close()
})

const asAdmin = { dni: ADMIN, role: "admin" }

const configBody = (overrides = {}) => ({
  nombre_centro: "Centro Medico Appointly",
  telefono: "11 4000-0000",
  email_institucional: "contacto@appointly.dev",
  direccion: "Av. Siempre Viva 742, Salta",
  anticipacion_reserva_min: 60,
  limite_cancelacion_horas: 2,
  dias_habiles: [1, 2, 3, 4, 5],
  hora_apertura: "08:00",
  hora_cierre: "20:00",
  ...overrides,
})

const avisoBody = (overrides = {}) => ({
  titulo: "Aviso de prueba",
  mensaje: "Mensaje de prueba para el banner.",
  tipo: "info",
  activo: true,
  vigente_desde: null,
  vigente_hasta: null,
  ...overrides,
})

// --- C1: lectura pública ----------------------------------------------------------------

test("C1: GET /api/configuracion es público y devuelve el singleton del seed", async () => {
  const res = await t.api("GET", "/api/configuracion")

  assert.equal(res.status, 200)
  assert.equal(res.body.nombre_centro, "Centro Medico Appointly")
  assert.equal(res.body.anticipacion_reserva_min, 60)
  assert.equal(res.body.limite_cancelacion_horas, 2)
  assert.deepEqual(res.body.dias_habiles, [1, 2, 3, 4, 5])
  assert.equal(res.body.hora_apertura, "08:00")
  assert.equal(res.body.hora_cierre, "20:00")
})

test("C1: sin fila devuelve los defaults seguros (0/0, L-V, 08:00-20:00)", async () => {
  await t.pool.query("DELETE FROM configuracion")

  const res = await t.api("GET", "/api/configuracion")
  assert.equal(res.status, 200)
  assert.equal(res.body.nombre_centro, "")
  assert.equal(res.body.anticipacion_reserva_min, 0)
  assert.equal(res.body.limite_cancelacion_horas, 0)
  assert.deepEqual(res.body.dias_habiles, [1, 2, 3, 4, 5])
  assert.equal(res.body.hora_apertura, "08:00")
  assert.equal(res.body.hora_cierre, "20:00")

  await t.api("PUT", "/api/admin/configuracion", { as: asAdmin, body: configBody() })
})

// --- C2: reemplazo completo -------------------------------------------------------------

test("C2: PUT admin persiste el reemplazo completo y normaliza vacíos a null", async () => {
  const body = configBody({
    nombre_centro: "  Centro Renombrado  ",
    telefono: "   ",
    email_institucional: "",
    direccion: "  ",
    anticipacion_reserva_min: 30,
    limite_cancelacion_horas: 4,
    dias_habiles: [6, 0],
    hora_apertura: null,
    hora_cierre: null,
  })

  const res = await t.api("PUT", "/api/admin/configuracion", { as: asAdmin, body })
  assert.equal(res.status, 200)
  assert.equal(res.body.nombre_centro, "Centro Renombrado")
  assert.equal(res.body.telefono, null)
  assert.equal(res.body.email_institucional, null)
  assert.equal(res.body.direccion, null)
  assert.equal(res.body.anticipacion_reserva_min, 30)
  assert.equal(res.body.limite_cancelacion_horas, 4)
  assert.deepEqual(res.body.dias_habiles, [6, 0])
  assert.equal(res.body.hora_apertura, null)
  assert.equal(res.body.hora_cierre, null)

  const publica = await t.api("GET", "/api/configuracion")
  assert.deepEqual(publica.body, res.body)

  await t.api("PUT", "/api/admin/configuracion", { as: asAdmin, body: configBody() })
})

test("C2: sin sesión es 401; cliente/profesional es 403", async () => {
  assertError(await t.api("PUT", "/api/admin/configuracion", { body: configBody() }), 401, "UNAUTHORIZED")
  assertError(
    await t.api("PUT", "/api/admin/configuracion", {
      as: { dni: 22456789, role: "cliente" },
      body: configBody(),
    }),
    403,
    "FORBIDDEN",
  )
})

test("C2: valida días, email, horas y rango de apertura/cierre", async () => {
  const sinDias = await t.api("PUT", "/api/admin/configuracion", {
    as: asAdmin,
    body: configBody({ dias_habiles: [] }),
  })
  assertError(sinDias, 400, "BAD_REQUEST")
  assert.ok(sinDias.body.fieldErrors.dias_habiles)

  const emailMalo = await t.api("PUT", "/api/admin/configuracion", {
    as: asAdmin,
    body: configBody({ email_institucional: "no-es-un-mail" }),
  })
  assertError(emailMalo, 400, "BAD_REQUEST")
  assert.ok(emailMalo.body.fieldErrors.email_institucional)

  const mediaFranja = await t.api("PUT", "/api/admin/configuracion", {
    as: asAdmin,
    body: configBody({ hora_apertura: "08:00", hora_cierre: null }),
  })
  assertError(mediaFranja, 400, "BAD_REQUEST")
  assert.ok(mediaFranja.body.fieldErrors.hora_apertura)

  const invertida = await t.api("PUT", "/api/admin/configuracion", {
    as: asAdmin,
    body: configBody({ hora_apertura: "20:00", hora_cierre: "08:00" }),
  })
  assertError(invertida, 400, "BAD_REQUEST")
  assert.ok(invertida.body.fieldErrors.hora_cierre)
})

// --- C3: avisos públicos ----------------------------------------------------------------

test("C3: GET /api/avisos/activos es público y excluye inactivos, futuros y vencidos", async () => {
  const res = await t.api("GET", "/api/avisos/activos")

  assert.equal(res.status, 200)
  const titulos = res.body.map((a) => a.titulo)
  assert.ok(titulos.includes("Corte de luz programado"))
  assert.ok(titulos.includes("Campana de vacunacion"))
  assert.equal(titulos.includes("Vacaciones de verano"), false)
})

test("C3: un aviso vencido o inactivo no aparece; uno crítico se ordena primero", async () => {
  const vencido = await t.api("POST", "/api/admin/avisos", {
    as: asAdmin,
    body: avisoBody({ titulo: "Vencido", vigente_hasta: fechaEnDias(-1) }),
  })
  assert.equal(vencido.status, 201)

  const inactivo = await t.api("POST", "/api/admin/avisos", {
    as: asAdmin,
    body: avisoBody({ titulo: "Inactivo", activo: false }),
  })
  assert.equal(inactivo.status, 201)

  const critico = await t.api("POST", "/api/admin/avisos", {
    as: asAdmin,
    body: avisoBody({ titulo: "Crítico", tipo: "critico" }),
  })
  assert.equal(critico.status, 201)

  const activos = await t.api("GET", "/api/avisos/activos")
  const titulos = activos.body.map((a) => a.titulo)
  assert.equal(titulos.includes("Vencido"), false)
  assert.equal(titulos.includes("Inactivo"), false)
  assert.equal(titulos[0], "Crítico")

  await t.api("DELETE", `/api/admin/avisos/${vencido.body.id}`, { as: asAdmin })
  await t.api("DELETE", `/api/admin/avisos/${inactivo.body.id}`, { as: asAdmin })
  await t.api("DELETE", `/api/admin/avisos/${critico.body.id}`, { as: asAdmin })
})

// --- C4–C7: gestión admin ---------------------------------------------------------------

test("C4–C7: listar, crear, editar, desactivar y borrar avisos", async () => {
  assertError(await t.api("GET", "/api/admin/avisos"), 401, "UNAUTHORIZED")
  assertError(
    await t.api("GET", "/api/admin/avisos", { as: { dni: 22456789, role: "cliente" } }),
    403,
    "FORBIDDEN",
  )

  const todos = await t.api("GET", "/api/admin/avisos", { as: asAdmin })
  assert.equal(todos.status, 200)
  assert.equal(todos.body.length, 3) // seed: 2 activos + 1 futuro

  const creado = await t.api("POST", "/api/admin/avisos", {
    as: asAdmin,
    body: avisoBody({ titulo: "  Nuevo aviso  ", mensaje: "  Hola  ", vigente_desde: fechaEnDias(0) }),
  })
  assert.equal(creado.status, 201)
  assert.equal(creado.body.titulo, "Nuevo aviso")
  assert.equal(creado.body.mensaje, "Hola")
  assert.equal(creado.body.activo, true)
  assert.equal(creado.body.vigente_desde, fechaEnDias(0))

  const activos = await t.api("GET", "/api/avisos/activos")
  assert.ok(activos.body.some((a) => a.id === creado.body.id))

  const editado = await t.api("PUT", `/api/admin/avisos/${creado.body.id}`, {
    as: asAdmin,
    body: avisoBody({ titulo: "Aviso editado", activo: false }),
  })
  assert.equal(editado.status, 200)
  assert.equal(editado.body.titulo, "Aviso editado")
  assert.equal(editado.body.activo, false)

  const activosTrasEditar = await t.api("GET", "/api/avisos/activos")
  assert.equal(activosTrasEditar.body.some((a) => a.id === creado.body.id), false)

  const borrado = await t.api("DELETE", `/api/admin/avisos/${creado.body.id}`, { as: asAdmin })
  assert.equal(borrado.status, 204)
  assert.equal(borrado.body, null)

  const borradoOtraVez = await t.api("DELETE", `/api/admin/avisos/${creado.body.id}`, { as: asAdmin })
  assertError(borradoOtraVez, 404, "NOT_FOUND")
})

test("C5/C6: validación de avisos y rango de vigencia", async () => {
  const sinTitulo = await t.api("POST", "/api/admin/avisos", {
    as: asAdmin,
    body: avisoBody({ titulo: "   " }),
  })
  assertError(sinTitulo, 400, "BAD_REQUEST")
  assert.ok(sinTitulo.body.fieldErrors.titulo)

  const tipoMalo = await t.api("POST", "/api/admin/avisos", {
    as: asAdmin,
    body: avisoBody({ tipo: "urgente" }),
  })
  assertError(tipoMalo, 400, "BAD_REQUEST")
  assert.ok(tipoMalo.body.fieldErrors.tipo)

  const rangoInvertido = await t.api("POST", "/api/admin/avisos", {
    as: asAdmin,
    body: avisoBody({ vigente_desde: fechaEnDias(3), vigente_hasta: fechaEnDias(1) }),
  })
  assertError(rangoInvertido, 400, "BAD_REQUEST")
  assert.ok(rangoInvertido.body.fieldErrors.vigente_hasta)

  assertError(
    await t.api("PUT", "/api/admin/avisos/9999", { as: asAdmin, body: avisoBody() }),
    404,
    "NOT_FOUND",
  )
  assertError(
    await t.api("PUT", "/api/admin/avisos/abc", { as: asAdmin, body: avisoBody() }),
    400,
    "BAD_REQUEST",
  )
})
