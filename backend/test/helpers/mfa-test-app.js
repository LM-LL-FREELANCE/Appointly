import { readFile } from "node:fs/promises"
import http from "node:http"
import mysql from "mysql2/promise"

// Seed accounts used by the MFA suite (src/scripts/seed.sql): all share the
// bcrypt hash of "password123".
export const ADMIN = 27845123 // tiene cuenta admin (id_rol=3) y profesional (id_rol=2)
export const CLIENTE = 22456789
export const PROFESIONAL = 27845123
export const PASSWORD = "password123"

const SCRIPTS = new URL("../../src/scripts/", import.meta.url)
const JWT_SECRET = "mfa-test-secret-not-for-production"

/** Reads a .sql script and retargets its database statements to the scratch DB. */
const loadScript = async (file, dbName) => {
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

/**
 * Creates a scratch database (appt_mfa_test_<pid>) from schema.sql + seed.sql,
 * points config/db.js at it and mounts ONLY the auth endpoints needed by the
 * MFA flow (without rate limiters, so suites stay deterministic). The real
 * routes/limiters are exercised by curl against the dev server (querys/mfa.http).
 */
export async function startMfaTestApp() {
  const dbName = `appt_mfa_test_${process.pid}`

  // Everything that reads these must be imported AFTER they are set.
  process.env.DB_NAME = dbName
  process.env.JWT_SECRET = JWT_SECRET
  delete process.env.RESEND_API_KEY

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

  const [
    { default: express },
    { default: cookieParser },
    { pool },
    { default: errorHandler },
    { validate },
    { loginSchema },
    { mfaVerificarSchema, mfaReenviarSchema },
    { AuthController },
    { attachUser },
    { EmailMethods },
  ] = await Promise.all([
    import("express"),
    import("cookie-parser"),
    import("../../src/config/db.js"),
    import("../../src/middlewares/error.middleware.js"),
    import("../../src/validators/validate.js"),
    import("../../src/schemas/auth.schema.js"),
    import("../../src/schemas/mfa.schema.js"),
    import("../../src/controllers/auth.controller.js"),
    import("../../src/middlewares/auth.middleware.js"),
    import("../../src/emails/email.methods.js"),
  ])

  const [[{ db }]] = await pool.query("SELECT DATABASE() AS db")
  if (db !== dbName) throw new Error(`refusing to run: pool is on "${db}", expected "${dbName}"`)

  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.post("/api/auth/login", validate(loginSchema), AuthController.login)
  app.post("/api/auth/mfa/verificar", validate(mfaVerificarSchema), AuthController.verificarMfa)
  app.post("/api/auth/mfa/reenviar", validate(mfaReenviarSchema), AuthController.reenviarMfa)
  app.get("/api/auth/me", attachUser, AuthController.me)
  app.use(errorHandler)

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const baseUrl = `http://127.0.0.1:${server.address().port}`

  /** Returns { status, body, cookies } (cookies = raw Set-Cookie strings). */
  const api = async (method, path, { body, cookie } = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    return {
      status: res.status,
      body: text ? JSON.parse(text) : null,
      cookies: res.headers.getSetCookie(),
    }
  }

  /** Extracts "access_token=..." from the Set-Cookie headers (or null). */
  const cookieDe = (res) => {
    const setCookie = res.cookies.find((c) => c.startsWith("access_token="))
    return setCookie ? setCookie.split(";")[0] : null
  }

  const getCodigoRow = async (idCodigo) => {
    const [rows] = await pool.query(
      `SELECT id_codigo, dni_persona, codigo_hash, expira_en, intentos, consumido_en, creado_en
         FROM mfa_codigo WHERE id_codigo = ?`, [idCodigo])
    return rows[0] ?? null
  }

  const getUltimoCodigo = async (dni) => {
    const [rows] = await pool.query(
      `SELECT id_codigo, dni_persona, codigo_hash, expira_en, intentos, consumido_en, creado_en
         FROM mfa_codigo WHERE dni_persona = ? ORDER BY id_codigo DESC LIMIT 1`, [dni])
    return rows[0] ?? null
  }

  const contarCodigos = async (dni) => {
    const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM mfa_codigo WHERE dni_persona = ?`, [dni])
    return rows[0].total
  }

  /** Retrocede `creado_en` (y `expira_en`) para saltear el cooldown de reenvío. */
  const backdatearCodigo = async (idCodigo, minutos = 2) => {
    await pool.query(
      `UPDATE mfa_codigo
         SET creado_en = creado_en - INTERVAL ? MINUTE,
             expira_en = expira_en - INTERVAL ? MINUTE
         WHERE id_codigo = ?`, [minutos, minutos, idCodigo])
  }

  const close = async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    await pool.end()
    await admin.query(`DROP DATABASE IF EXISTS \`${dbName}\``)
    await admin.end()
  }

  return { api, cookieDe, pool, EmailMethods, JWT_SECRET, getCodigoRow, getUltimoCodigo, contarCodigos, backdatearCodigo, close }
}
