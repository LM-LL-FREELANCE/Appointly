import { ProfesionalesService } from "../services/profesionales.service.js"

export class ProfesionalesController {
  
  static async getHorariosByDni(req, res, next) {
    const dni = Number(req.params.dni)

    try {
      const horarios = await ProfesionalesService.obtenerHorariosPorDni(dni)    
      res.status(200).json(horarios)
      
    } catch(err) {
      next(err)
    }
  }

  static async createHorario(req, res, next) {
    const { dia_semana, hora_inicio, hora_fin } = req.body
    const dni = req.params.dni

    try {
      const horario = await ProfesionalesService.createHorario(dni, { dia_semana, hora_inicio, hora_fin })
      res.status(201).json(horario)

    } catch(err) {
      next(err)
    }
  }

  static async updateHorario(req, res, next) {
    const { dia_semana, hora_inicio, hora_fin } = req.body
    const id = req.params.id

    try {
      const horario = await ProfesionalesService.updateHorario(id, { dia_semana, hora_inicio, hora_fin })
      res.status(200).json(horario)

    } catch(err) {
      next(err)
    }

  }

  static async deleteHorario(req, res, next) {

    try {
      await ProfesionalesService.deleteHorario(req.params.id)
      res.status(204).send()

    } catch(err) {
      next(err)
    }
  }
}
