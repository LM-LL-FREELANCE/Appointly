import { ProfesionalesService } from "../services/profesionales.service.js"
import { ProfesionalesModel } from "../models/profesionales.model.js"
import { AppError } from "../utils/AppError.js"
import { profesionalesDataSchema } from "../schemas/profesionales.schema.js"

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
      const { especialidad } = req.query
      const obraSocial = req.query.obraSocial || req.query.obrasocial || req.query.obra_social
      const profesionales = await ProfesionalesModel.filterBy({ especialidad, obraSocial })
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
    try {
      const { dni } = req.params
      if (!dni) throw new AppError("The dni must be on the request", 404, "NOT_FOUND")
      const parsedDataSchema = profesionalesDataSchema.partial().safeParse(req.body)
      if (!parsedDataSchema.success) throw new AppError("The data sent is not valid, check", 400, "BAD_REQUEST")
      const profesional = await ProfesionalesModel.updateByDni({ dni, ...parsedDataSchema.data })
      if (!profesional) throw new AppError("we could not update the data of the profesional")
      res.status(200).json({
        success: true,
        data: profesional
      })
    } catch (err) {
      next(err)
    }
  }

  static async deleteAcc(req, res, next) {
    try {

      const { dni } = req.params

      if (!dni) throw new AppError("the dni must be in the request", 400)

      const updated = await ProfesionalesModel.deleteAcc({ dni })

      if (!updated) throw new AppError("we could not delete your account", 400)

      return res.json({
        success: true,
        msg: "your account has been deleted"
      })

    } catch (err) {

      next(err)

    }
  }
}


