// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken"
import { AppError } from "../utils/AppError.js"

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
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })

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
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
    req.user = { dni: payload.sub, role: payload.role }
  } catch {
    req.user = null
  }

  next()
}