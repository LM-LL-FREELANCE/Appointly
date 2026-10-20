import test, { before, after } from "node:test"
import assert from "node:assert/strict"
import http from "node:http"
import jwt from "jsonwebtoken"
import { startTestApp, ADMIN, CLIENTE, OTRO_CLIENTE, PROF, OTRO_PROF } from "./helpers/test-app.js"
import { assertError } from "./helpers/asserts.js"

// WS1 — Gestion de usuarios y cuentas (U1–U7) contra una DB scratch.
// La app de prueba monta el router real con los mismos guards que admin.routes.js.

let t
let server
let baseUrl
let AuthService
let EmailMethods

const admin = { dni: ADMIN, role: "admin" }

before(async () => {
  t = await startTestApp()

  const [
    { default: express },
    { default: cookieParser },
    { adminUsuariosRouter },
    { requireAuth, grantAccess },
    { default: errorHandler },
    authServiceModule,
    emailModule,
  ] = await Promise.all([
    import("express"),
    import("cookie-parser"),
    import("../src/routes/adminUsuarios.routes.js"),
    import("../src/middlewares/auth.middleware.js"),
    import("../src/middlewares/error.middleware.js"),
    import("../src/services/auth.service.js"),
    import("../src/emails/email.methods.js"),
  ])

  AuthService = authServiceModule.AuthService
  EmailMethods = emailModule.EmailMethods

  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use("/api/admin/usuarios", requireAuth, grantAccess(["admin"]), adminUsuariosRouter)
  app.use(errorHandler)

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  server?.closeAllConnections()
  await new Promise((resolve) => server?.close(resolve))
  await t?.close()
})

/** `as` es { dni, role }; sin `as` no manda cookie. */
const api = async (method, path, { as, body } = {}) => {
  const token = as
    ? jwt.sign({ role: as.role }, process.env.JWT_SECRET, { algorithm: "HS256", subject: String(as.dni), expiresIn: "1h" })
    : null

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Cookie: `access_token=${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null }
}

const contarCuentas = async () => {
  const [[{ total }]] = await t.pool.query("SELECT COUNT(*) AS total FROM persona_rol")
  return total
}

const estadoEnDb = async (dni, rolId) => {
  const [rows] = await t.pool.query(
    "SELECT suspendido_en, eliminado_en FROM persona_rol WHERE dni_persona = ? AND id_rol = ?",
    [dni, rolId],
  )
  const row = rows[0]
  if (row.eliminado_en) return "baja"
  if (row.suspendido_en) return "suspendida"
  return "activa"
}

// ---------------------------------------------------------------- guards

test("U*: sin sesion es 401 y con sesion de cliente es 403", async () => {
  assertError(await api("GET", "/api/admin/usuarios"), 401, "UNAUTHORIZED")
  assertError(await api("GET", "/api/admin/usuarios", { as: { dni: CLIENTE, role: "cliente" } }), 403, "FORBIDDEN")
})

// ---------------------------------------------------------------- U1 listado

test("U1: lista todas las cuentas con los campos del contrato", async () => {
  const res = await api("GET", "/api/admin/usuarios", { as: admin })

  assert.equal(res.status, 200)
  assert.equal(res.body.length, await contarCuentas())

  const ricardo = res.body.find((c) => c.dni === CLIENTE && c.rol === "cliente")
  assert.ok(ricardo, "falta la cuenta de Ricardo Sosa")
  for (const campo of ["dni", "rol", "nombre", "apellido", "correo", "telefono", "estado", "creado_en"]) {
    assert.ok(campo in ricardo, `falta el campo ${campo}`)
  }
  assert.equal(ricardo.estado, "activa")
  assert.equal(ricardo.apellido, "Sosa")
})

test("U1: filtra por rol", async () => {
  const res = await api("GET", "/api/admin/usuarios?rol=profesional", { as: admin })

  assert.equal(res.status, 200)
  assert.ok(res.body.length >= 5)
  assert.ok(res.body.every((c) => c.rol === "profesional"))
})

test("U1: filtra por estado activa/suspendida/baja", async () => {
  await t.pool.query("UPDATE persona_rol SET suspendido_en = NOW() WHERE dni_persona = ? AND id_rol = 1", [CLIENTE])
  await t.pool.query("UPDATE persona_rol SET eliminado_en = NOW() WHERE dni_persona = ? AND id_rol = 1", [OTRO_CLIENTE])

  try {
    const suspendidas = await api("GET", "/api/admin/usuarios?estado=suspendida", { as: admin })
    assert.equal(suspendidas.status, 200)
    assert.ok(suspendidas.body.some((c) => c.dni === CLIENTE && c.estado === "suspendida"))
    assert.ok(suspendidas.body.every((c) => c.estado === "suspendida"))

    const bajas = await api("GET", "/api/admin/usuarios?estado=baja", { as: admin })
    assert.ok(bajas.body.some((c) => c.dni === OTRO_CLIENTE && c.estado === "baja"))
    assert.ok(bajas.body.every((c) => c.estado === "baja"))

    const activas = await api("GET", "/api/admin/usuarios?estado=activa", { as: admin })
    assert.ok(activas.body.every((c) => c.estado === "activa"))
    assert.ok(!activas.body.some((c) => c.dni === CLIENTE))
  } finally {
    await t.pool.query("UPDATE persona_rol SET suspendido_en = NULL WHERE dni_persona = ? AND id_rol = 1", [CLIENTE])
    await t.pool.query("UPDATE persona_rol SET eliminado_en = NULL WHERE dni_persona = ? AND id_rol = 1", [OTRO_CLIENTE])
  }
})

test("U1: la busqueda q matchea nombre, apellido, correo y DNI (y escapa comodines)", async () => {
  const porNombre = await api("GET", "/api/admin/usuarios?q=Ricardo", { as: admin })
  assert.deepEqual(porNombre.body.map((c) => c.dni), [CLIENTE])

  const porApellido = await api("GET", "/api/admin/usuarios?q=Sosa", { as: admin })
  assert.deepEqual(porApellido.body.map((c) => c.dni), [CLIENTE])

  const porCorreo = await api("GET", "/api/admin/usuarios?q=ricardo.sosa@mail.com", { as: admin })
  assert.deepEqual(porCorreo.body.map((c) => c.dni), [CLIENTE])

  const porDni = await api("GET", `/api/admin/usuarios?q=${CLIENTE}`, { as: admin })
  assert.deepEqual(porDni.body.map((c) => c.dni), [CLIENTE])

  // Dos cuentas de la misma persona (Aguirre profesional + admin).
  const dosCuentas = await api("GET", "/api/admin/usuarios?q=Aguirre", { as: admin })
  assert.deepEqual(dosCuentas.body.map((c) => c.rol).sort(), ["admin", "profesional"])

  const sinResultados = await api("GET", "/api/admin/usuarios?q=NoExisteNadie", { as: admin })
  assert.deepEqual(sinResultados.body, [])

  // Los comodines de LIKE tipeados son texto, no patrones.
  const comodines = await api("GET", "/api/admin/usuarios?q=%25", { as: admin })
  assert.deepEqual(comodines.body, [])
})

test("U1: filtros combinados y filtros invalidos", async () => {
  const combinado = await api("GET", "/api/admin/usuarios?rol=profesional&q=Aguirre&estado=activa", { as: admin })
  assert.deepEqual(combinado.body.map((c) => c.dni), [PROF])

  assertError(await api("GET", "/api/admin/usuarios?rol=superadmin", { as: admin }), 400, "BAD_REQUEST")
  assertError(await api("GET", "/api/admin/usuarios?estado=muerta", { as: admin }), 400, "BAD_REQUEST")
})

// ---------------------------------------------------------------- U2 ficha

test("U2: ficha de cliente con perfil e historial con la contraparte", async () => {
  const res = await api("GET", `/api/admin/usuarios/${CLIENTE}/cliente`, { as: admin })

  assert.equal(res.status, 200)
  assert.equal(res.body.nombre, "Ricardo")
  assert.equal(res.body.estado, "activa")
  assert.equal(res.body.perfil.obra_social, "OSDE")
  assert.equal(res.body.perfil.numero_afiliado, "OS1-22456789/00")

  assert.equal(res.body.turnos.length, 1)
  const turno = res.body.turnos[0]
  assert.equal(turno.estado, "confirmado")
  assert.equal(turno.contraparte.dni, PROF)
  assert.equal(turno.contraparte.apellido, "Aguirre")
})

test("U2: ficha de profesional con matricula, duracion e historial con el cliente", async () => {
  const res = await api("GET", `/api/admin/usuarios/${PROF}/profesional`, { as: admin })

  assert.equal(res.status, 200)
  assert.equal(res.body.perfil.numero_matricula, "MP-10234")
  assert.equal(res.body.perfil.duracion_turno_min, 30)
  assert.ok(res.body.turnos.length >= 5)
  assert.ok(res.body.turnos.every((turno) => turno.contraparte.dni !== PROF))
})

test("U2: ficha de admin sin perfil propio y sin historial", async () => {
  const res = await api("GET", `/api/admin/usuarios/${ADMIN}/admin`, { as: admin })

  assert.equal(res.status, 200)
  assert.equal(res.body.perfil, null)
  assert.deepEqual(res.body.turnos, [])
})

test("U2: cuenta inexistente es 404 y parametros invalidos son 400", async () => {
  assertError(await api("GET", "/api/admin/usuarios/99999999/cliente", { as: admin }), 404, "NOT_FOUND")
  assertError(await api("GET", "/api/admin/usuarios/abc/cliente", { as: admin }), 400, "BAD_REQUEST")
  assertError(await api("GET", `/api/admin/usuarios/${CLIENTE}/paciente`, { as: admin }), 400, "BAD_REQUEST")
})

// ---------------------------------------------------------------- U3 edicion

test("U3: edita telefono, obra social nueva y numero de afiliado de un cliente", async () => {
  const res = await api("PATCH", `/api/admin/usuarios/${CLIENTE}/cliente`, {
    as: admin,
    body: { telefono: "11-5555-0000", obra_social: "OSDE Premium", numero_afiliado: "OSP-1234" },
  })

  assert.equal(res.status, 200)
  assert.equal(res.body.telefono, "11-5555-0000")
  assert.equal(res.body.perfil.obra_social, "OSDE Premium")
  assert.equal(res.body.perfil.numero_afiliado, "OSP-1234")

  const [[persona]] = await t.pool.query("SELECT telefono FROM persona WHERE dni_persona = ?", [CLIENTE])
  assert.equal(persona.telefono, "11-5555-0000")
})

test("U3: acepta obra social existente por nombre y por id, y permite limpiarla", async () => {
  const porNombre = await api("PATCH", `/api/admin/usuarios/${CLIENTE}/cliente`, {
    as: admin, body: { obra_social: "Swiss Medical" },
  })
  assert.equal(porNombre.status, 200)
  assert.equal(porNombre.body.perfil.id_obra_social, 2)

  const porId = await api("PATCH", `/api/admin/usuarios/${CLIENTE}/cliente`, {
    as: admin, body: { obra_social: 3 },
  })
  assert.equal(porId.status, 200)
  assert.equal(porId.body.perfil.id_obra_social, 3)

  const limpiar = await api("PATCH", `/api/admin/usuarios/${CLIENTE}/cliente`, {
    as: admin, body: { obra_social: "", numero_afiliado: "" },
  })
  assert.equal(limpiar.status, 200)
  assert.equal(limpiar.body.perfil.obra_social, null)
  assert.equal(limpiar.body.perfil.numero_afiliado, null)

  const inexistente = await api("PATCH", `/api/admin/usuarios/${CLIENTE}/cliente`, {
    as: admin, body: { obra_social: 99999 },
  })
  assert.equal(inexistente.status, 422)
})

test("U3: edita matricula y duracion de un profesional, y rechaza matricula duplicada", async () => {
  const ok = await api("PATCH", `/api/admin/usuarios/${PROF}/profesional`, {
    as: admin, body: { numero_matricula: "MP-99999", duracion_turno_min: 45 },
  })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.perfil.numero_matricula, "MP-99999")
  assert.equal(ok.body.perfil.duracion_turno_min, 45)

  const duplicada = await api("PATCH", `/api/admin/usuarios/${PROF}/profesional`, {
    as: admin, body: { numero_matricula: "MP-10589" },
  })
  assertError(duplicada, 409, "DUPLICATE_MATRICULA")
  assert.ok(duplicada.body.fieldErrors.numero_matricula, "el 409 debe traer el error del campo")

  // La misma matricula del propio profesional no es conflicto.
  const propia = await api("PATCH", `/api/admin/usuarios/${PROF}/profesional`, {
    as: admin, body: { numero_matricula: "MP-99999" },
  })
  assert.equal(propia.status, 200)
})

test("U3: valida campos por rol y cuerpo vacio", async () => {
  const campoAjeno = await api("PATCH", `/api/admin/usuarios/${PROF}/profesional`, {
    as: admin, body: { obra_social: "OSDE" },
  })
  assertError(campoAjeno, 400, "BAD_REQUEST")
  assert.match(JSON.stringify(campoAjeno.body.fieldErrors), /obra_social/)

  const adminConMatricula = await api("PATCH", `/api/admin/usuarios/${ADMIN}/admin`, {
    as: admin, body: { numero_matricula: "MP-00000" },
  })
  assertError(adminConMatricula, 400, "BAD_REQUEST")

  const vacio = await api("PATCH", `/api/admin/usuarios/${CLIENTE}/cliente`, { as: admin, body: {} })
  assertError(vacio, 400, "BAD_REQUEST")

  assertError(await api("PATCH", "/api/admin/usuarios/99999999/cliente", {
    as: admin, body: { telefono: "11-0000-0000" },
  }), 404, "NOT_FOUND")
})

// ---------------------------------------------------------------- U4/U5 suspension

test("U4/U5: suspender bloquea el login y mata la sesion; reactivar restaura", async () => {
  const suspendido = await api("POST", `/api/admin/usuarios/${CLIENTE}/cliente/suspension`, { as: admin })
  assert.equal(suspendido.status, 200)
  assert.equal(suspendido.body.estado, "suspendida")
  assert.equal(await estadoEnDb(CLIENTE, 1), "suspendida")

  await assert.rejects(
    () => AuthService.login(String(CLIENTE), "password123", "cliente"),
    (err) => err.statusCode === 403 && err.code === "ACCOUNT_SUSPENDED",
  )
  assert.equal(await AuthService.getSession(String(CLIENTE), "cliente"), null)

  assertError(await api("POST", `/api/admin/usuarios/${CLIENTE}/cliente/suspension`, { as: admin }), 409, "ALREADY_SUSPENDED")

  const reactivado = await api("POST", `/api/admin/usuarios/${CLIENTE}/cliente/reactivacion`, { as: admin })
  assert.equal(reactivado.status, 200)
  assert.equal(reactivado.body.estado, "activa")

  const { user } = await AuthService.login(String(CLIENTE), "password123", "cliente")
  assert.equal(user.dni, CLIENTE)
  assert.ok(await AuthService.getSession(String(CLIENTE), "cliente"))

  assertError(await api("POST", `/api/admin/usuarios/${CLIENTE}/cliente/reactivacion`, { as: admin }), 409, "NOT_SUSPENDED")
})

test("U4: suspender una cuenta inexistente es 404", async () => {
  assertError(await api("POST", "/api/admin/usuarios/99999999/cliente/suspension", { as: admin }), 404, "NOT_FOUND")
})

// ---------------------------------------------------------------- U6 baja

test("U6: la baja conserva los turnos, mata la sesion y se revierte con reactivacion", async () => {
  const [[antes]] = await t.pool.query("SELECT COUNT(*) AS total FROM turno WHERE dni_cliente = ?", [OTRO_CLIENTE])
  assert.ok(antes.total > 0, "el seed debe darle turnos a esta cliente")

  const baja = await api("DELETE", `/api/admin/usuarios/${OTRO_CLIENTE}/cliente`, { as: admin })
  assert.equal(baja.status, 204)
  assert.equal(await estadoEnDb(OTRO_CLIENTE, 1), "baja")

  const [[despues]] = await t.pool.query("SELECT COUNT(*) AS total FROM turno WHERE dni_cliente = ?", [OTRO_CLIENTE])
  assert.equal(despues.total, antes.total, "los turnos historicos no se tocan")

  // La ficha sigue visible (para poder reactivar) y el login queda muerto.
  const ficha = await api("GET", `/api/admin/usuarios/${OTRO_CLIENTE}/cliente`, { as: admin })
  assert.equal(ficha.status, 200)
  assert.equal(ficha.body.estado, "baja")

  await assert.rejects(
    () => AuthService.login(String(OTRO_CLIENTE), "password123", "cliente"),
    (err) => err.statusCode === 401 && err.code === "INVALID_CREDENTIALS",
  )
  assert.equal(await AuthService.getSession(String(OTRO_CLIENTE), "cliente"), null)

  const reactivado = await api("POST", `/api/admin/usuarios/${OTRO_CLIENTE}/cliente/reactivacion`, { as: admin })
  assert.equal(reactivado.status, 200)
  assert.equal(reactivado.body.estado, "activa")
  assert.ok(await AuthService.getSession(String(OTRO_CLIENTE), "cliente"))
})

test("U6: repetir la baja es 204 y no cambia nada", async () => {
  const clienteTemporal = 10000003
  await t.pool.query(
    "INSERT INTO persona (dni_persona, nombre, apellido, fecha_nacimiento, genero) VALUES (?, 'Temp', 'Baja', '1990-01-01', 'X')",
    [clienteTemporal],
  )
  await t.pool.query(
    "INSERT INTO persona_rol (dni_persona, id_rol, correo, password_hash) VALUES (?, 1, 'temp.baja@test.dev', 'x')",
    [clienteTemporal],
  )
  await t.pool.query("INSERT INTO cliente (dni_cliente) VALUES (?)", [clienteTemporal])

  assert.equal((await api("DELETE", `/api/admin/usuarios/${clienteTemporal}/cliente`, { as: admin })).status, 204)
  assert.equal((await api("DELETE", `/api/admin/usuarios/${clienteTemporal}/cliente`, { as: admin })).status, 204)
  assert.equal(await estadoEnDb(clienteTemporal, 1), "baja")
})

test("U6: un admin no puede darse de baja a si mismo", async () => {
  const res = await api("DELETE", `/api/admin/usuarios/${ADMIN}/admin`, { as: admin })

  assertError(res, 409, "CANNOT_DELETE_SELF")
  assert.equal(await estadoEnDb(ADMIN, 3), "activa")
})

// ---------------------------------------------------------------- U7 reset

test("U7: genera el token, envia el email de la cuenta y el link funciona", async () => {
  const original = EmailMethods.resetPassWord
  const capturado = []
  EmailMethods.resetPassWord = async (payload) => { capturado.push(payload) }

  try {
    const res = await api("POST", `/api/admin/usuarios/${CLIENTE}/cliente/reset-password`, { as: admin })

    assert.equal(res.status, 200)
    assert.deepEqual(res.body, { success: true })
    assert.equal(capturado.length, 1)
    assert.equal(capturado[0].correo, "ricardo.sosa@mail.com")
    assert.match(capturado[0].link, /resetear-contraseña\//)

    const token = capturado[0].link.split("/").pop()
    await AuthService.resetPassWord({ password: "claveNueva123", token })

    const { user } = await AuthService.login(String(CLIENTE), "claveNueva123", "cliente")
    assert.equal(user.dni, CLIENTE)
  } finally {
    EmailMethods.resetPassWord = original
  }
})

test("U7: cuenta inexistente es 404 y un fallo de email es 502", async () => {
  assertError(await api("POST", "/api/admin/usuarios/99999999/cliente/reset-password", { as: admin }), 404, "NOT_FOUND")

  const original = EmailMethods.resetPassWord
  EmailMethods.resetPassWord = async () => { throw new Error("resend caido") }

  try {
    assertError(await api("POST", `/api/admin/usuarios/${OTRO_PROF}/profesional/reset-password`, { as: admin }), 502, "EMAIL_SEND_FAILED")
  } finally {
    EmailMethods.resetPassWord = original
  }
})
