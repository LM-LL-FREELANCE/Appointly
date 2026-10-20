import { AvisosModel } from "../models/avisos.model.js"
import { AppError } from "../utils/AppError.js"
import { emitAvisoPublicado } from "../socket/events.js"

const noExiste = () => new AppError("El aviso no existe.", 404, "NOT_FOUND")

export class AvisosService {
  static getActivos() {
    return AvisosModel.getActivos()
  }

  static getAll() {
    return AvisosModel.getAll()
  }

  static async crear(data, actor) {
    const aviso = await AvisosModel.create(data, actor.dni)
    emitAvisoPublicado({
      id_aviso: aviso.id,
      titulo: aviso.titulo,
      tipo: aviso.tipo,
      activo: aviso.activo,
    })
    return aviso
  }

  static async editar(id, data) {
    if (!(await AvisosModel.getById(id))) throw noExiste()

    const aviso = await AvisosModel.update(id, data)
    emitAvisoPublicado({
      id_aviso: aviso.id,
      titulo: aviso.titulo,
      tipo: aviso.tipo,
      activo: aviso.activo,
    })
    return aviso
  }

  static async eliminar(id) {
    if (!(await AvisosModel.delete(id))) throw noExiste()
  }
}
