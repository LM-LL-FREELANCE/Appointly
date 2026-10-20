import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import http from "node:http"
import jwt from "jsonwebtoken"
import { createRequire } from "node:module"
import { initSocket, emitToAdmins, emitToMfa } from "../src/socket/index.js"

const JWT_SECRET = "socket-test-secret-not-for-production"
process.env.JWT_SECRET = JWT_SECRET

// socket.io-client es dependencia del frontend (Ola 2). Se resuelve desde ahí
// para no sumar dependencias al backend; si no está instalado, la suite se
// saltea (la verificación manual E2E se hace con curl + script suelto).
const require = createRequire(new URL("../../frontend/package.json", import.meta.url))
let ioClient = null
try {
  ioClient = require("socket.io-client").io
} catch {
  ioClient = null
}
const sinCliente = ioClient ? false : "socket.io-client no disponible en frontend/node_modules"

let server
let baseUrl

before(async () => {
  server = http.createServer()
  initSocket(server)
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
})

const conectar = (opciones = {}, timeoutMs = 5000) => new Promise((resolve) => {
  const socket = ioClient(baseUrl, { reconnection: false, timeout: 2000, ...opciones })
  const timer = setTimeout(() => resolve({ ok: false, socket, agoto: true }), timeoutMs)

  socket.once("connect", () => {
    clearTimeout(timer)
    resolve({ ok: true, socket })
  })
  socket.once("connect_error", () => {
    clearTimeout(timer)
    resolve({ ok: false, socket })
  })
})

const esperarEvento = (socket, evento, timeoutMs = 3000) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`timeout esperando ${evento}`)), timeoutMs)
  socket.once(evento, (payload) => {
    clearTimeout(timer)
    resolve(payload)
  })
})

const tokenSesion = ({ dni, role }) =>
  jwt.sign({ sub: String(dni), role }, JWT_SECRET, { expiresIn: "1h" })

const challengeMfa = (codeId, overrides = {}) =>
  jwt.sign(
    { sub: "27845123", role: "admin", purpose: "mfa", code_id: codeId, ...overrides },
    JWT_SECRET,
    { expiresIn: "10m" },
  )

// --- handshake ---------------------------------------------------------------------------------

test("socket: sin cookie ni challenge el handshake se rechaza (§9)", { skip: sinCliente }, async () => {
  const { ok, socket, agoto } = await conectar()

  assert.equal(agoto, undefined, "no debe colgarse: connect_error")
  assert.equal(ok, false)
  socket.close()
})

test("socket: una sesión de cliente no entra (solo rol admin)", { skip: sinCliente }, async () => {
  const cookie = `access_token=${tokenSesion({ dni: 22456789, role: "cliente" })}`

  const { ok, socket } = await conectar({ extraHeaders: { Cookie: cookie } })

  assert.equal(ok, false)
  socket.close()
})

test("socket: el challenge MFA no entra como cookie de sesión", { skip: sinCliente }, async () => {
  const cookie = `access_token=${challengeMfa(42)}`

  const { ok, socket } = await conectar({ extraHeaders: { Cookie: cookie } })

  assert.equal(ok, false)
  socket.close()
})

test("socket: challenge inválido en auth.mfa se rechaza", { skip: sinCliente }, async () => {
  const { ok, socket } = await conectar({ auth: { mfa: "no-es-un-jwt" } })

  assert.equal(ok, false)
  socket.close()
})

// --- salas -------------------------------------------------------------------------------------

test("socket: sesión admin entra a `admins` y recibe turno:creado", { skip: sinCliente }, async () => {
  const cookie = `access_token=${tokenSesion({ dni: 27845123, role: "admin" })}`
  const { ok, socket } = await conectar({ extraHeaders: { Cookie: cookie } })
  assert.equal(ok, true)

  const espera = esperarEvento(socket, "turno:creado")
  emitToAdmins("turno:creado", { id_turno: 777, estado: "pendiente_confirmacion" })

  assert.deepEqual(await espera, { id_turno: 777, estado: "pendiente_confirmacion" })
  socket.close()
})

test("socket: challenge entra a `mfa:<id_codigo>` y recibe los eventos mfa:*", { skip: sinCliente }, async () => {
  const { ok, socket } = await conectar({ auth: { mfa: challengeMfa(42) } })
  assert.equal(ok, true)

  const espera = esperarEvento(socket, "mfa:codigo_enviado")
  emitToMfa(42, "mfa:codigo_enviado")
  assert.deepEqual(await espera, {})

  const fallido = esperarEvento(socket, "mfa:intento_fallido")
  emitToMfa(42, "mfa:intento_fallido", { restantes: 3 })
  assert.deepEqual(await fallido, { restantes: 3 })

  const verificado = esperarEvento(socket, "mfa:verificado")
  emitToMfa(42, "mfa:verificado")
  await verificado

  // Los eventos de otra sala no llegan.
  const ajeno = esperarEvento(socket, "mfa:bloqueado", 500)
  emitToMfa(99, "mfa:bloqueado")
  await assert.rejects(ajeno, /timeout/)

  socket.close()
})
