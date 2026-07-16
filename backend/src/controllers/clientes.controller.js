import { ClientesModel } from "../models/clientes.model.js"
import { ClientesService } from "../services/clientes.service.js"
import { AppError } from "../utils/AppError.js"

export class ClientesController {

  /* static async getTurnosClienteByDni(req, res, next) {
    const { dni } = req.params
    const requesterDni = req.user.dni
    const { estado } = req.query

    try {
      const turnos = await ClientesService.getTurnosClienteByDni(dni, requesterDni, estado)
      return res.status(200).json(turnos)

    } catch (err) {
      next(err)
    }
  } */

  static async getTurnosClienteByDni(req, res, next) {
    const { dni } = req.params
    const requesterDni = req.user.dni

    try {
      const turnos = await ClientesService.getTurnosClienteByDni(dni, requesterDni)
      return res.status(200).json(turnos)

    } catch (err) {
      next(err)
    }
  }

  static async getClienteByDni(req, res, next) {
    const { dni } = req.params
    try {
      const cliente = await ClientesModel.getClienteByDni({ dni })
      if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado', code: 'NOT_FOUND' })
      return res.status(200).json(cliente)
    } catch (err) {
      next(err)
    }
  }

  static async getTurnosMes(req, res, next) {
    try {
      const { dni } = req.params
      if (!dni) return res.status(400).json({ error: "el dni del cliente es obligatorio", code: "NOT_FOUND" })
      let { month, year } = req.query
      if (!month && !year) {
        const fecha_actual = new Date()
        month = fecha_actual.getMonth() + 1
        year = fecha_actual.getFullYear()
      }

      const data = await ClientesModel.getTurnosMes({ dni, month, year })

      if (!data) return res.status(400).json({ error: "no encontramos turnos para ese cliente", code: "NOT_FOUND" })

      return res.status(200).json({
        success: true,
        mes_buscado: month,
        año_buscado: year,
        data: data
      })

    } catch (err) {
      next(err)
    }
  }

  static async getActivos(req, res, next) {
    try {
      const { dni } = req.params
      if (!dni) throw new AppError("the dni must be on the request", 400, "NOT_FOUND")

      const turnosActivos = await ClientesModel.getActivos({ dni })

      if (turnosActivos.length === 0) throw new AppError("we could not find the turnos for the cliente")

      res.json({
        success: true,
        data: turnosActivos
      })

    } catch (err) {
      next(err)
    }

  }
}