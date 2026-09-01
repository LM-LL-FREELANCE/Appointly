import { rateLimit } from 'express-rate-limit'
import { AppError } from "../utils/AppError.js"

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Demasiadas peticiones desde esta IP. Por favor, intentá nuevamente en 15 minutos.', 429,
      'TOO_MANY_REQUESTS'))
  }
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Demasiados intentos de inicio de sesión. Por seguridad, esperá 15 minutos.', 429,
      'AUTH_RATE_LIMIT_EXCEEDED'))
  }
})

export const sensitiveActionsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Demasiadas solicitudes de registro o recuperación. Esperá 1 hora.', 429,
      'ACTION_RATE_LIMIT_EXCEEDED'))
  }
})