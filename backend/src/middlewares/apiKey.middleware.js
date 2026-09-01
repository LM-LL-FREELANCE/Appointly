import { AppError } from "../utils/AppError.js"

export const requireApiKey = (req, res, next) => {
  const clienteApiKey = req.headers['x-api-key']
  if (req.method === 'OPTIONS') return next()
  if (!clienteApiKey) return next(new AppError("Se requiere de una API KEY para acceder a este recurso", 401, "API_KEY_REQUIRED"))
  if (clienteApiKey !== process.env.API_KEY) return next(new AppError("API Key inválida o no autorizada.", 403, "INVALID_API_KEY"))
  next()
}