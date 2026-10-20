// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken"
import { AppError } from "../utils/AppError.js"

// Un token con `purpose` es pre-sesión (ej. el challenge MFA del login admin):
// NUNCA vale como access_token, si no el segundo factor se saltaría con solo
// copiar el challenge a la cookie (PLAN §13.3). Lanza si no es sesión.
const verifySessionToken = (token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })

  if (payload.purpose) throw new Error("not a session token")

  return payload
}

/**
 * Middleware opcional para proteger rutas que requieran roles específicos (ej. admin)
 */
export const grantAccess = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new AppError("No tenés permisos para realizar esta acción.", 403, "FORBIDDEN")
    }
    next();
  };
};

export const requireAuth = (req, res, next) => {

  const token = req.cookies?.access_token
  if (!token) return next(new AppError("No estás autenticado.", 401, "UNAUTHORIZED"))

  try {
    const payload = verifySessionToken(token)

    req.user = {
      dni: String(payload.sub),
      role: payload.role
    }

    next()

  } catch {
    return next(new AppError("Sesión expirada o inválida.", 401, "UNAUTHORIZED"))
  }

}

export const attachUser = (req, res, next) => {
  const token = req.cookies?.access_token
  if (!token) {
    req.user = null
    return next()
  }

  try {
    const payload = verifySessionToken(token)
    req.user = { dni: payload.sub, role: payload.role }
  } catch {
    req.user = null
  }

  next()
}