import { ClientesModel } from "../models/clientes.model.js"
import { ClientesService } from "../services/clientes.service.js"



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

  static async getTurnosMes() {

  }
}