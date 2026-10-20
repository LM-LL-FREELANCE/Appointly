import { io } from 'socket.io-client'

// Singleton del socket del panel (PLAN_ADMIN.md §9 / DISENO §13).
// - Admin logueado: `getSocket()` conecta con la cookie de sesión.
// - Login MFA: `getSocket({ mfa: challenge })` conecta a la sala del desafío.
// El servidor autentica el handshake; acá no se manda ningún dato sensible.

let socket = null
let authKey = null

const keyFor = (auth = {}) => (auth?.mfa ? `mfa:${auth.mfa}` : 'session')

export function getSocket(auth = {}) {
  const nextKey = keyFor(auth)

  if (socket && authKey === nextKey) return socket

  // Si cambia el modo (desafío -> sesión o al revés), la conexión anterior ya
  // no sirve: se cierra antes de abrir la nueva.
  if (socket) {
    socket.disconnect()
    socket = null
  }

  authKey = nextKey
  socket = io({ withCredentials: true, auth })
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
  authKey = null
}
