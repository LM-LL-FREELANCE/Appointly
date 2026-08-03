import { ClientesModel } from "../models/clientes.model.js"
import { ClientesService } from "../services/clientes.service.js"
import { AppError } from "../utils/AppError.js"
import { clienteDataSchema } from "../schemas/cliente.schema.js"


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
    const { estado } = req.query

    try {
      const turnos = await ClientesService.getTurnosClienteByDni(dni, requesterDni, estado)
      return res.status(200).json(turnos)

    } catch (err) {
      next(err)
    }
  }

  static async getClienteByDni(req, res, next) {
    const { dni } = req.params
    try {
      const cliente = await ClientesModel.getClienteByDni({ dni })
      if (!cliente) throw new AppError('Cliente no encontrado', 404, 'NOT_FOUND');
      return res.status(200).json(cliente)
    } catch (err) {
      next(err)
    }
  }

  static async getTurnosMes(req, res, next) {
    try {
      const { dni } = req.params
      if (!dni) throw new AppError("el dni del cliente es obligatorio", 404, "NOT_FOUND");
      let { month, year } = req.query
      if (!month && !year) {
        const fecha_actual = new Date()
        month = fecha_actual.getMonth() + 1
        year = fecha_actual.getFullYear()
      }

      const data = await ClientesModel.getTurnosMes({ dni, month, year })

      if (!data) throw new AppError("no encontramos turnos para ese cliente", 404, "NOT_FOUND");

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
      if (!dni) throw new AppError("the dni must be on the request", 404, "NOT_FOUND")

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

  static async patchClienteData(req, res, next) {
    try {
      const { dni } = req.params

      if (!dni) throw new AppError("the dni must be on the request", 404, "NOT_FOUND")

      const parsedData = clienteDataSchema.partial().safeParse(req.body)

      if (!parsedData.success) {
        throw new AppError('invalid', 400, 'VALIDATION_FAILED', parsedData.error.flatten().fieldErrors);
      }

      const updatedData = await ClientesModel.patchClienteData({ dni, data: parsedData.data })

      if (!updatedData) throw new AppError("We could't update your data", 409)

      return res.status(200).json({ success: true, message: "Perfil actualizado correctamente" });
    }
    catch (err) {
      next(err)
    }

  }

  static async deleteAccount(req, res, next) {
    try {
      const { dni } = req.params
      if (!dni) throw new AppError("the dni must be on the request", 404, "NOT_FOUND")
      const deletedAcc = await ClientesModel.deleteAccount({ dni })
      if (!deletedAcc) throw new AppError("We couldn't delete your account")

      res.status(200).json({
        success: true,
        message: "Se ha eliminado correctamente la cuenta"
      })
    }
    catch (err) {
      next(err)
    }
  }
}