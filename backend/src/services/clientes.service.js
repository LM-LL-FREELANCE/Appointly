import { ClientesModel } from "../models/clientes.model.js"
import { AppError } from "../utils/AppError.js"

export class ClientesService {

  /* static async getTurnosClienteByDni(dni, requesterDni, estado) {

    if (requesterDni !== dni) {
      throw new AppError("No tienes permiso para realizar esta acción", 403, "FORBIDDEN")
    }

    if (!estado) {
      throw new AppError("El parámetro 'estado' es requerido", 400, "BAD_REQUEST")
    }

    return await ClientesModel.getTurnosClienteByDni(dni, estado)
  } */

  static async getTurnosClienteByDni(dni, requesterDni) {

    if ((requesterDni) !== dni) {
      throw new AppError("No tienes permiso para realizar esta acción", 403, "FORBIDDEN")
    }

    return await ClientesModel.getTurnosClienteByDni(dni)
  }
}