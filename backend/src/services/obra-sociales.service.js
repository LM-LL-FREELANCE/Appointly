import { ObraSocialesModel } from "../models/obra-sociales.model.js"
import { AppError } from "../utils/AppError.js"

const duplicado = () => new AppError("Ya existe una obra social con ese nombre.", 409, "DUPLICATE_NAME")
const noExiste = () => new AppError("La obra social no existe.", 404, "NOT_FOUND")

// El UNIQUE de `obra_social.nombre_obra_social` es la última barrera contra
// carreras entre el chequeo y el INSERT/UPDATE (mismo patrón que especialidades).
const comoAppError = (error) => (error?.code === "ER_DUP_ENTRY" ? duplicado() : error)

export class ObraSocialesService {
  static getAll() {
    return ObraSocialesModel.getAll()
  }

  static async getById(id) {
    const obraSocial = await ObraSocialesModel.getById(id)
    if (!obraSocial) throw noExiste()
    return obraSocial
  }

  static async crear({ nombre_obra_social }) {
    if (await ObraSocialesModel.existeNombre(nombre_obra_social)) throw duplicado()
    try {
      return await ObraSocialesModel.create({ nombre_obra_social })
    } catch (error) {
      throw comoAppError(error)
    }
  }

  static async editar(id, { nombre_obra_social }) {
    await ObraSocialesService.getById(id)
    if (await ObraSocialesModel.existeNombre(nombre_obra_social, id)) throw duplicado()
    try {
      return await ObraSocialesModel.update(id, { nombre_obra_social })
    } catch (error) {
      throw comoAppError(error)
    }
  }

  static async cambiarEstado(id, activo) {
    await ObraSocialesService.getById(id)
    return ObraSocialesModel.updateEstado(id, activo)
  }

  static async getProfesionales(id) {
    await ObraSocialesService.getById(id)
    return ObraSocialesModel.getProfesionales(id)
  }
}
