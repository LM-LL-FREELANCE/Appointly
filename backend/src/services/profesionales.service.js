import { ProfesionalesModel } from "../models/profesionales.model.js"
import { AppError } from "../utils/AppError.js"

export class ProfesionalesService {

  static async obtenerHorariosPorDni(dni) {
    const horarios = await ProfesionalesModel.getHorariosByDni(dni)
    return horarios
  }

  static async checkOverlap(dni, {dia_semana, hora_inicio, hora_fin}) {
    const [result] = await ProfesionalesModel.checkOverlap(dni, {dia_semana, hora_inicio, hora_fin})

    if (result.count > 0) {
      throw new AppError("Este rango horario ya no está disponible.", 409, "SCHEDULE_OVERLAP")
    }
  }

  static async createHorario(dni, {dia_semana, hora_inicio, hora_fin}) {

    await ProfesionalesService.checkOverlap(dni, { dia_semana, hora_inicio, hora_fin })
    
    return await ProfesionalesModel.createHorario(dni, { dia_semana, hora_inicio, hora_fin })
  }

  static async updateHorario(dni, {dia_semana, hora_inicio, hora_fin}) {

    await ProfesionalesService.checkOverlap(dni, { dia_semana, hora_inicio, hora_fin })

    return await ProfesionalesModel.updateHorario(dni, { dia_semana, hora_inicio, hora_fin })
  }

  static async deleteHorario(id) {
    const affectedRows = ProfesionalesModel.deleteHorario(id)

    if (affectedRows === 0) {
      throw new AppError("El horario no existe.", 404, "NOT_FOUND")
    }
  }
}