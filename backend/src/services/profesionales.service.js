import { getTurnosByDni } from "../repositories/profesionales.repository.js"
import { AppError } from "../utils/AppError.js"

export const obtenerTurnosPorDni = async (dni) => {
  const turnos = await getTurnosByDni(dni)

  if (turnos.length === 0) {
    const error = new AppError("El profesional no tiene turnos asignados", 404, "NOT_FOUND")
    throw error
  }

  return turnos
}
