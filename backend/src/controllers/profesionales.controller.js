import { ProfesionalesService } from "../services/profesionales.service.js"
import { ProfesionalesModel } from "../models/profesionales.model.js"
import { AppError } from "../utils/AppError.js"
export class ProfesionalesController {

  static async getHorariosByDni(req, res, next) {
    const dni = Number(req.params.dni)

    try {
      const horarios = await ProfesionalesService.obtenerHorariosPorDni(dni)
      res.status(200).json(horarios)

    } catch (err) {
      next(err)
    }
  }

  static async createHorario(req, res, next) {
    const { dia_semana, hora_inicio, hora_fin } = req.body
    const dni = req.params.dni

    try {
      const horario = await ProfesionalesService.createHorario(dni, { dia_semana, hora_inicio, hora_fin })
      res.status(201).json(horario)

    } catch (err) {
      next(err)
    }
  }

  static async updateHorario(req, res, next) {
    const { dia_semana, hora_inicio, hora_fin } = req.body
    const id = req.params.id

    try {
      const horario = await ProfesionalesService.updateHorario(id, { dia_semana, hora_inicio, hora_fin })
      res.status(200).json(horario)

    } catch (err) {
      next(err)
    }

  }

  static async deleteHorario(req, res, next) {

    try {
      await ProfesionalesService.deleteHorario(req.params.id)
      res.status(204).send()

    } catch (err) {
      next(err)
    }
  }

  static async filterBy(req, res, next) {
    try {
      const { especialidad, obrasocial } = req.query
      const profesionales = await ProfesionalesModel.filterBy({ especialidad, obraSocial: obrasocial })
      if (profesionales.length === 0) {
        throw new AppError("We couldn't find any professionals with the given filters", 404, "NOT_FOUND");
      }
      return res.json(profesionales)
    } catch (err) {
      next(err);
    }
  }

  static async getByDni(req, res, next) {
    try {
      const { dni } = req.params
      const profesionalData = await ProfesionalesModel.getByDni({ dni })
      if (!profesionalData) {
        throw new AppError("We could not find your profesional", 404, "NOT_FOUND");
      }

      return res.json(profesionalData)
    } catch (err) {
      next(err);
    }
  }

  static async existe(req, res, next) {
    try {
      const { dni } = req.params
      const existeProfesional = await ProfesionalesModel.existe({ dni })

      return res.json(existeProfesional)
    } catch (err) {
      next(err);
    }
  }

  static async updateByDni(req, res, next) {
    const { dni } = req.params
    const { nombre, apellido, correo, foto_url } = req.body

    try {
      const profesional = await ProfesionalesService.updateByDni({ dni, nombre, apellido, correo, foto_url })
      res.status(200).json(profesional)
    } catch (err) {
      next(err)
    }
  }
}


