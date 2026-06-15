import { AppError } from "../utils/AppError.js"

export const horarioValidator = (req, res, next) => {
  const { dia_semana, hora_inicio, hora_fin } = req.body

  const timeChecker = /^([01]\d|2[0-3]):[0-5]\d$/

  if (Number(dia_semana) < 0 || Number(dia_semana) > 6) {
    return next(new AppError("dia_semana debe ser un número entre 0 y 6.", 400, "VALIDATION_ERROR"))
  }

  if (!timeChecker.test(hora_inicio) || !timeChecker.test(hora_fin)) {
    return next(new AppError("El formato de hora debe ser HH:MM.", 400, "VALIDATION_ERROR"))
  }

  if (hora_inicio >= hora_fin) {
    return next(new AppError("hora_inicio debe ser menor que hora_fin.", 400, "VALIDATION_ERROR"))
  }
  
  next()
}