import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import http from "node:http"
import mysql from "mysql2/promise"
import jwt from "jsonwebtoken"

// Catálogos maestros (PLAN_ADMIN.md §8.7 E1–E10). Scratch DB propia: corre en
// paralelo con las demás suites sin tocar `appointly`.

// DNIs del seed (backend/src/scripts/seed.sql).
const ADMIN = 27845123 // Aguirre: profesional y admin a la vez
const PROF = 30156789
const CLIENTE = 22456789
const JWT_SECRET = "test-secret-not-for-production"

const SCRIPTS = new URL("../src/scripts/", import.meta.url)

let t

before(async () => {
  t = await startTestApp()
})
after(async () => {
  await t?.close()
})

const assertError = (res, status, code) => {
  assert.equal(res.status, status)
  assert.equal(res.body.code, code)
}

// --- E1: lectura pública -----------------------------------------------------------------

test("E1: GET /api/especialidades es público e incluye activo y profesionales asociados", async () => {
  const res = await t.api("GET", "/api/especialidades/")

  assert.equal(res.status, 200)
  const kinesiologia = res.body.find((e) => e.especialidad === "Kinesiologia")
  assert.deepEqual(kinesiologia, { id: 1, especialidad: "Kinesiologia", activo: 1, profesionales: 2 })
})

test("E6: GET /api/obra-sociales es público e incluye activo y profesionales asociados", async () => {
  const res = await t.api("GET", "/api/obra-sociales/")

  assert.equal(res.status, 200)
  const osde = res.body.find((o) => o.obra_social === "OSDE")
  assert.deepEqual(osde, { id: 1, obra_social: "OSDE", activo: 1, profesionales: 3 })
})

// --- E2/E7: alta -------------------------------------------------------------------------

test("E2: sin sesión → 401; cliente → 403; admin crea (nombre trimmeado) → 201", async () => {
  const body = { tipo: "  Cardiologia  " }

  assertError(await t.api("POST", "/api/especialidades/", { body }), 401, "UNAUTHORIZED")
  assertError(await t.api("POST", "/api/especialidades/", { as: { dni: CLIENTE, role: "cliente" }, body }), 403, "FORBIDDEN")

  const res = await t.api("POST", "/api/especialidades/", { as: { dni: ADMIN, role: "admin" }, body })
  assert.equal(res.status, 201)
  assert.equal(res.body.especialidad, "Cardiologia")
  assert.equal(res.body.activo, 1)
  assert.equal(res.body.profesionales, 0)
  assert.ok(res.body.id > 5)

  const lista = await t.api("GET", "/api/especialidades/")
  assert.ok(lista.body.some((e) => e.id === res.body.id && e.activo === 1))
})

test("E2: nombre duplicado (con y sin espacios) → 409 DUPLICATE_NAME; nombre vacío → 400", async () => {
  const as = { dni: ADMIN, role: "admin" }

  assertError(
    await t.api("POST", "/api/especialidades/", { as, body: { tipo: "Kinesiologia" } }),
    409, "DUPLICATE_NAME",
  )
  assertError(
    await t.api("POST", "/api/especialidades/", { as, body: { tipo: "  Cardiologia " } }),
    409, "DUPLICATE_NAME",
  )

  const vacio = await t.api("POST", "/api/especialidades/", { as, body: { tipo: "   " } })
  assertError(vacio, 400, "BAD_REQUEST")
  assert.ok(vacio.body.fieldErrors.tipo)
})

// --- E3/E8: edición ----------------------------------------------------------------------

test("E3: admin edita el tipo; duplicado → 409; id inexistente → 404", async () => {
  const as = { dni: ADMIN, role: "admin" }
  const creada = await t.api("POST", "/api/especialidades/", { as, body: { tipo: "Neurologia" } })

  const editada = await t.api("PUT", `/api/especialidades/${creada.body.id}`, { as, body: { tipo: "Neurologia Infantil" } })
  assert.equal(editada.status, 200)
  assert.equal(editada.body.especialidad, "Neurologia Infantil")

  assertError(
    await t.api("PUT", `/api/especialidades/${creada.body.id}`, { as, body: { tipo: "Kinesiologia" } }),
    409, "DUPLICATE_NAME",
  )
  assertError(await t.api("PUT", "/api/especialidades/9999", { as, body: { tipo: "Fantasma" } }), 404, "NOT_FOUND")
  assertError(await t.api("PUT", "/api/especialidades/abc", { as, body: { tipo: "Fantasma" } }), 400, "BAD_REQUEST")
  assertError(await t.api("PUT", `/api/especialidades/${creada.body.id}`, { as: { dni: PROF, role: "profesional" }, body: { tipo: "X" } }), 403, "FORBIDDEN")
})

// --- E4: habilitar/deshabilitar ------------------------------------------------------------

test("E4: deshabilitar una especialidad no rompe sus relaciones y la lectura pública la conserva con activo=0", async () => {
  const as = { dni: ADMIN, role: "admin" }

  const off = await t.api("PATCH", "/api/especialidades/1/estado", { as, body: { activo: false } })
  assert.equal(off.status, 200)
  assert.equal(off.body.activo, 0)

  const lista = await t.api("GET", "/api/especialidades/")
  const kinesiologia = lista.body.find((e) => e.id === 1)
  assert.equal(kinesiologia.activo, 0)
  assert.equal(kinesiologia.profesionales, 2)

  const asociados = await t.api("GET", "/api/especialidades/1/profesionales", { as })
  assert.equal(asociados.body.length, 2)

  const on = await t.api("PATCH", "/api/especialidades/1/estado", { as, body: { activo: true } })
  assert.equal(on.body.activo, 1)
})

test("E4: estado con payload inválido → 400; id inexistente → 404", async () => {
  const as = { dni: ADMIN, role: "admin" }

  assertError(await t.api("PATCH", "/api/especialidades/1/estado", { as, body: { activo: "si" } }), 400, "BAD_REQUEST")
  assertError(await t.api("PATCH", "/api/especialidades/1/estado", { as, body: {} }), 400, "BAD_REQUEST")
  assertError(await t.api("PATCH", "/api/especialidades/9999/estado", { as, body: { activo: true } }), 404, "NOT_FOUND")
})

// --- E5: profesionales asociados -----------------------------------------------------------

test("E5: profesionales asociados lista nombre, matrícula y dni; es admin-only", async () => {
  const as = { dni: ADMIN, role: "admin" }

  const res = await t.api("GET", "/api/especialidades/1/profesionales", { as })
  assert.equal(res.status, 200)
  assert.deepEqual(
    res.body.map((p) => p.dni).sort((a, b) => a - b),
    [ADMIN, PROF].sort((a, b) => a - b),
  )
  for (const p of res.body) {
    assert.ok(p.nombre && p.apellido && p.numero_matricula)
  }

  assertError(await t.api("GET", "/api/especialidades/1/profesionales", { as: { dni: PROF, role: "profesional" } }), 403, "FORBIDDEN")
  assertError(await t.api("GET", "/api/especialidades/9999/profesionales", { as }), 404, "NOT_FOUND")
})

// --- E7–E10: espejo en obras sociales ------------------------------------------------------

test("E7–E10: ABM de obras sociales espeja especialidades", async () => {
  const as = { dni: ADMIN, role: "admin" }

  const creada = await t.api("POST", "/api/obra-sociales/", { as, body: { nombre_obra_social: "Obra Nueva" } })
  assert.equal(creada.status, 201)
  assert.equal(creada.body.obra_social, "Obra Nueva")

  assertError(
    await t.api("POST", "/api/obra-sociales/", { as, body: { nombre_obra_social: "OSDE" } }),
    409, "DUPLICATE_NAME",
  )
  assertError(
    await t.api("POST", "/api/obra-sociales/", { as: { dni: CLIENTE, role: "cliente" }, body: { nombre_obra_social: "Otra" } }),
    403, "FORBIDDEN",
  )

  const editada = await t.api("PUT", `/api/obra-sociales/${creada.body.id}`, { as, body: { nombre_obra_social: "Obra Renombrada" } })
  assert.equal(editada.status, 200)
  assert.equal(editada.body.obra_social, "Obra Renombrada")

  const off = await t.api("PATCH", `/api/obra-sociales/${creada.body.id}/estado`, { as, body: { activo: false } })
  assert.equal(off.body.activo, 0)

  const asociados = await t.api("GET", "/api/obra-sociales/1/profesionales", { as })
  assert.equal(asociados.body.length, 3)
  assertError(await t.api("GET", "/api/obra-sociales/1/profesionales"), 401, "UNAUTHORIZED")
})

// --- Infra de test -------------------------------------------------------------------------

/** Reads a .sql script and retargets its database statements to the scratch DB. */
async function loadScript(file, dbName) {
  let sql = await readFile(new URL(file, SCRIPTS), "utf8")
  sql = sql
    .replace(/^CREATE DATABASE IF NOT EXISTS appointly;/m, `CREATE DATABASE \`${dbName}\`;`)
    .replace(/^USE appointly;/m, `USE \`${dbName}\`;`)

  const uses = [...sql.matchAll(/^\s*USE\s+`?(\w+)`?\s*;/gim)].map((m) => m[1])
  if (uses.length !== 1 || uses[0] !== dbName) {
    throw new Error(`${file}: expected exactly one USE ${dbName}, found [${uses.join(", ")}]`)
  }
  return sql
}

async function startTestApp() {
  const dbName = `appt_cat_test_${process.pid}`

  // Everything that reads these must be imported AFTER they are set.
  process.env.DB_NAME = dbName
  process.env.JWT_SECRET = JWT_SECRET

  const admin = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  })
  await admin.query(`DROP DATABASE IF EXISTS \`${dbName}\``)
  await admin.query(await loadScript("schema.sql", dbName))
  await admin.query(await loadScript("seed.sql", dbName))

  const [{ default: express }, { default: cookieParser }, { pool }, { default: errorHandler }] = await Promise.all([
    import("express"),
    import("cookie-parser"),
    import("../src/config/db.js"),
    import("../src/middlewares/error.middleware.js"),
  ])
  const [{ especialidadesRouter }, { obraSocialesRouter }] = await Promise.all([
    import("../src/routes/especialidades.routes.js"),
    import("../src/routes/obra-sociales.routes.js"),
  ])

  const [[{ db }]] = await pool.query("SELECT DATABASE() AS db")
  if (db !== dbName) throw new Error(`refusing to run: pool is on "${db}", expected "${dbName}"`)

  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use("/api/especialidades", especialidadesRouter)
  app.use("/api/obra-sociales", obraSocialesRouter)
  app.use(errorHandler)

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const baseUrl = `http://127.0.0.1:${server.address().port}`

  const tokenFor = ({ dni, role }) => jwt.sign({ role }, JWT_SECRET, { algorithm: "HS256", subject: String(dni), expiresIn: "1h" })

  const api = async (method, path, { as, body } = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(as ? { Cookie: `access_token=${tokenFor(as)}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : null }
  }

  const close = async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    await pool.end()
    await admin.query(`DROP DATABASE IF EXISTS \`${dbName}\``)
    await admin.end()
  }

  return { api, close }
}
