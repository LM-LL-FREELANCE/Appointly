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

// Segundo factor del admin: backstop por IP, ademas del limite de intentos
// por codigo que vive en la base (5 intentos).
export const mfaVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Demasiados intentos de verificación. Esperá unos minutos y volvé a probar.', 429,
      'MFA_RATE_LIMIT_EXCEEDED'))
  }
})

// Envios masivos: 3 por hora por IP (PLAN §8.5, M4).
export const massMailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Hiciste demasiados envíos. Esperá una hora e intentá de nuevo.', 429,
      'ACTION_RATE_LIMIT_EXCEEDED'))
  }
})
