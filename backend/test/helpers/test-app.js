import { readFile } from "node:fs/promises"
import http from "node:http"
import mysql from "mysql2/promise"
import jwt from "jsonwebtoken"
import { fechaEnDias } from "../../src/utils/time.js"

// Seed people used across the suites (see src/scripts/seed.sql).
export const PROF = 27845123 // Aguirre: Mon/Wed/Fri 08:00-13:00 and Mon/Wed 16:00-20:00
export const OTRO_PROF = 30156789 // Vega
export const PROF_C = 28934567 // Fernandez
export const PROF_D = 31678234 // Quiroga
export const CLIENTE = 22456789
export const OTRO_CLIENTE = 25890123
// Created by the helper in the scratch DB (the seed admin shares Aguirre's DNI).
export const ADMIN = 10000001
export const CLIENTE_AISLADO = 10000002 // client with no turnos, for list tests

const SCRIPTS = new URL("../../src/scripts/", import.meta.url)
const JWT_SECRET = "test-secret-not-for-production"

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

/** Next date (>= minDias from today) that falls on `diaSemana` (0=Sun..6=Sat). */
export const proximoDiaSemana = (diaSemana, minDias = 2) => {
  for (let i = minDias; i < minDias + 7; i++) {
    const fecha = fechaEnDias(i)
    const [y, m, d] = fecha.split("-").map(Number)
    if (new Date(Date.UTC(y, m - 1, d)).getUTCDay() === diaSemana) return fecha
  }
  throw new Error("unreachable")
}

/**
 * Creates a scratch database (appt_test_<pid>) from schema.sql + seed.sql, points
 * config/db.js at it, mounts the turnos/clientes routers on a minimal Express app
 * and listens on an ephemeral port. Never touches the real `appointly` database.
 */
export async function startTestApp() {
  const dbName = `appt_test_${process.pid}`

  // Everything that reads these must be imported AFTER they are set.
  process.env.DB_NAME = dbName
  process.env.JWT_SECRET = JWT_SECRET
  delete process.env.RESEND_API_KEY // no real emails; the cancel mail failure is caught

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
    import("../../src/config/db.js"),
    import("../../src/middlewares/error.middleware.js"),
  ])
  const [
    { turnosRouter }, { clientesRouter }, { TurnosController }, { TurnosModel },
    { requireAuth, grantAccess }, { EmailMethods },
    { configuracionRouter }, { avisosRouter }, { adminConfiguracionRouter }, { adminAvisosRouter },
  ] = await Promise.all([
    import("../../src/routes/turnos.routes.js"),
    import("../../src/routes/clientes.routes.js"),
    import("../../src/controllers/turnos.controller.js"),
    import("../../src/models/turnos.model.js"),
    import("../../src/middlewares/auth.middleware.js"),
    import("../../src/emails/email.methods.js"),
    import("../../src/routes/configuracion.routes.js"),
    import("../../src/routes/avisos.routes.js"),
    import("../../src/routes/adminConfiguracion.routes.js"),
    import("../../src/routes/adminAvisos.routes.js"),
  ])

  const [[{ db }]] = await pool.query("SELECT DATABASE() AS db")
  if (db !== dbName) throw new Error(`refusing to run: pool is on "${db}", expected "${dbName}"`)

  await pool.query(`INSERT INTO persona (dni_persona, nombre, apellido, fecha_nacimiento, genero) VALUES
    (?, 'Ada', 'Admin', '1980-01-01', 'F'), (?, 'Cora', 'Aislada', '1990-01-01', 'F')`, [ADMIN, CLIENTE_AISLADO])
  await pool.query(`INSERT INTO persona_rol (dni_persona, id_rol, correo, password_hash) VALUES
    (?, 3, 'ada.admin@test.dev', 'x'), (?, 1, 'cora.aislada@test.dev', 'x')`, [ADMIN, CLIENTE_AISLADO])
  await pool.query("INSERT INTO cliente (dni_cliente) VALUES (?)", [CLIENTE_AISLADO])

  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use("/api/turnos", turnosRouter)
  app.use("/api/clientes", clientesRouter)
  app.use("/api/configuracion", configuracionRouter)
  app.use("/api/avisos", avisosRouter)
  app.use("/api/admin/configuracion", requireAuth, grantAccess(["admin"]), adminConfiguracionRouter)
  app.use("/api/admin/avisos", requireAuth, grantAccess(["admin"]), adminAvisosRouter)
  // Same route as profesionales.routes.js (which pulls in unrelated controllers).
  app.get("/api/profesionales/:dni/slots", requireAuth, TurnosController.getSlots)
  app.use(errorHandler)

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const baseUrl = `http://127.0.0.1:${server.address().port}`

  const tokenFor = ({ dni, role }) => jwt.sign({ role }, JWT_SECRET, { algorithm: "HS256", subject: String(dni), expiresIn: "1h" })

  /** `as` is { dni, role }; omitted means no cookie. Returns { status, body }. */
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

  /** Inserts a turno straight into the DB (no event row). Returns its id. */
  const insertTurno = async ({ fecha, hora = "12:00", estado = "confirmado", profesional = PROF, cliente = CLIENTE, origen = null }) => {
    const [r] = await pool.query(
      `INSERT INTO turno (fecha_turno, hora_turno, estado, dni_profesional, dni_cliente, id_turno_origen) VALUES (?, ?, ?, ?, ?, ?)`,
      [fecha, hora, estado, profesional, cliente, origen],
    )
    return r.insertId
  }

  const insertEvento = async ({ id_turno, estado_anterior = null, estado_nuevo, dni_actor = null, rol_actor = null, motivo = null, creado_en = null }) => {
    const [r] = await pool.query(
      `INSERT INTO turno_evento (id_turno, estado_anterior, estado_nuevo, dni_actor, rol_actor, motivo, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [id_turno, estado_anterior, estado_nuevo, dni_actor, rol_actor, motivo, creado_en],
    )
    return r.insertId
  }

  const getTurno = async (id) => {
    const [rows] = await pool.query(
      `SELECT id_turno, DATE_FORMAT(fecha_turno, '%Y-%m-%d') AS fecha_turno, TIME_FORMAT(hora_turno, '%H:%i') AS hora_turno,
              estado, dni_profesional, dni_cliente, id_turno_origen, motivo_cancelacion, cancelado_en, completado_en
       FROM turno WHERE id_turno = ?`, [id])
    return rows[0]
  }

  const getEventos = async (id) => {
    const [rows] = await pool.query(
      `SELECT estado_anterior, estado_nuevo, dni_actor, rol_actor, motivo FROM turno_evento WHERE id_turno = ? ORDER BY id_evento`, [id])
    return rows
  }

  const close = async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    await pool.end()
    await admin.query(`DROP DATABASE IF EXISTS \`${dbName}\``)
    await admin.end()
  }

  return { api, pool, TurnosModel, EmailMethods, insertTurno, insertEvento, getTurno, getEventos, close }
}
