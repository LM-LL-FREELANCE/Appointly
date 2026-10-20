import { Server } from "socket.io"
import jwt from "jsonwebtoken"

/**
 * Infraestructura Socket.IO (PLAN_ADMIN.md §9).
 *
 * - Montada sobre el mismo http server de Express desde `src/server.js`.
 * - Handshake:
 *   · cookie `access_token` de sesión con role 'admin'  -> sala `admins`.
 *   · `auth: { mfa: "<challenge>" }` (JWT purpose 'mfa') -> sala `mfa:<id_codigo>`.
 *   · cualquier otro caso -> handshake rechazado (disconnect).
 * - El server SOLO emite; nunca acepta eventos de datos del cliente.
 * - Los emisores (`emitToAdmins`, `emitToMfa`) se llaman DESPUÉS de que la
 *   operación commiteó. Sin `initSocket` son no-op (tests, arranque parcial).
 */

let io = null

// Mini parser de cookies para no sumar dependencias: "a=1; b=2" -> { a: "1", b: "2" }.
const parseCookies = (header = "") => {
  const cookies = {}

  for (const part of String(header).split(";")) {
    const separator = part.indexOf("=")
    if (separator === -1) continue

    const key = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    if (!key) continue

    try {
      cookies[key] = decodeURIComponent(value)
    } catch {
      cookies[key] = value
    }
  }

  return cookies
}

const verifyAdminSession = (token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] })

  // Un token con `purpose` (challenge MFA) no es una sesión y no entra a `admins`.
  if (payload.purpose || payload.role !== "admin") throw new Error("not an admin session")

  return payload
}

const verifyMfaChallenge = (challenge) => {
  const payload = jwt.verify(challenge, process.env.JWT_SECRET, { algorithms: ["HS256"] })

  if (payload.purpose !== "mfa" || payload.code_id == null) {
    throw new Error("not an mfa challenge")
  }

  return payload
}

const authenticate = (socket, next) => {
  const { access_token: token } = parseCookies(socket.handshake.headers.cookie)

  if (token) {
    try {
      verifyAdminSession(token)
      socket.data.room = "admins"
      return next()
    } catch {
      return next(new Error("UNAUTHORIZED"))
    }
  }

  const challenge = socket.handshake.auth?.mfa

  try {
    const payload = verifyMfaChallenge(String(challenge ?? ""))
    socket.data.room = `mfa:${payload.code_id}`
    return next()
  } catch {
    return next(new Error("UNAUTHORIZED"))
  }
}

export const initSocket = (httpServer) => {
  io = new Server(httpServer)

  io.use(authenticate)

  io.on("connection", (socket) => {
    socket.join(socket.data.room)
  })

  return io
}

/** Emite a todos los admins conectados (sala `admins`). */
export const emitToAdmins = (evento, payload) => {
  io?.to("admins").emit(evento, payload)
}

/** Emite a la pantalla de login que espera el challenge `idCodigo`. */
export const emitToMfa = (idCodigo, evento, payload = {}) => {
  if (idCodigo == null) return
  io?.to(`mfa:${idCodigo}`).emit(evento, payload)
}
