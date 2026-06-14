import { ProfesionalesModel } from "../models/profesionales.model.js"
import * as profesionalesService from "../services/profesionales.service.js"

export const getTurnosByDni = async (req, res, next) => {
  try {
    const turnos = await profesionalesService.obtenerTurnosPorDni(Number(req.params.dni))
    res.status(200).json(turnos)
  } catch (err) {
    next(err)
  }
}


export class ProfesionalesController {
  static async filterBy(req, res) {
    const { especialidad, obrasocial } = req.query
    const profesionales = await ProfesionalesModel.filterBy({ especialidad, obraSocial: obrasocial })
    if (profesionales.length === 0) {
      return res.status(404).json({ message: "We couldn't find any professionals with the given filters" })
    }
    return res.json(profesionales)
  }
  static async getByDni(req, res) {
    const { dni } = req.params
    const profesionalData = await ProfesionalesModel.getByDni({ dni })
    if (!profesionalData) {
      return res.status(404).json({ message: "We could not find your profesional" })
    }

    return res.json(profesionalData)
  }
} 