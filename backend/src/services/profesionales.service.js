import { ProfesionalesModel } from "../models/profesionales.model.js"
import { AppError } from "../utils/AppError.js"

export class ProfesionalesService {

  static async obtenerHorariosPorDni(dni) {
    const horarios = await ProfesionalesModel.getHorariosByDni(dni)
    return horarios
  }

  static async checkOverlap(dni, { dia_semana, hora_inicio, hora_fin }, excludeId = null) {
    const [result] = await ProfesionalesModel.checkOverlap(dni, { dia_semana, hora_inicio, hora_fin }, excludeId)

    if (result.count > 0) {
      throw new AppError("Este rango horario ya no está disponible.", 409, "SCHEDULE_OVERLAP")
    }
  }

  static async createHorario(dni, { dia_semana, hora_inicio, hora_fin }) {

    await ProfesionalesService.checkOverlap(dni, { dia_semana, hora_inicio, hora_fin })

    return await ProfesionalesModel.createHorario(dni, { dia_semana, hora_inicio, hora_fin })
  }

  static async updateHorario(id, { dia_semana, hora_inicio, hora_fin }) {
    const horario = await ProfesionalesModel.getHorarioById(id)
    if (!horario) throw new AppError("El horario no existe.", 404, "NOT_FOUND")

    await ProfesionalesService.checkOverlap(horario.dni_profesional, { dia_semana, hora_inicio, hora_fin }, id)

    return await ProfesionalesModel.updateHorario(id, { dia_semana, hora_inicio, hora_fin })
  }

  static async deleteHorario(id) {
    const affectedRows = await ProfesionalesModel.deleteHorario(id)

    if (affectedRows === 0) {
      throw new AppError("El horario no existe.", 404, "NOT_FOUND")
    }
  }

  static async updateByDni({ dni, nombre, apellido, correo, foto_url }) {
    const profesional = await ProfesionalesModel.getByDni({ dni })
    if (!profesional) throw new AppError("El profesional no existe.", 404, "NOT_FOUND")

    return await ProfesionalesModel.updateByDni({ dni, nombre, apellido, correo, foto_url })
  }
}