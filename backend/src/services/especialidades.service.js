import { EspecialidadesModel } from "../models/especialidades.model.js"
import { AppError } from "../utils/AppError.js"

const duplicado = () => new AppError("Ya existe una especialidad con ese nombre.", 409, "DUPLICATE_NAME")
const noExiste = () => new AppError("La especialidad no existe.", 404, "NOT_FOUND")

// El UNIQUE de `especialidad.tipo` es la última barrera contra carreras entre
// el chequeo y el INSERT/UPDATE: se traduce al mismo 409 del contrato.
const comoAppError = (error) => (error?.code === "ER_DUP_ENTRY" ? duplicado() : error)

export class EspecialidadesService {
  static getAll() {
    return EspecialidadesModel.getAll()
  }

  static async getById(id) {
    const especialidad = await EspecialidadesModel.getById(id)
    if (!especialidad) throw noExiste()
    return especialidad
  }

  static async crear({ tipo }) {
    if (await EspecialidadesModel.existeNombre(tipo)) throw duplicado()
    try {
      return await EspecialidadesModel.create({ tipo })
    } catch (error) {
      throw comoAppError(error)
    }
  }

  static async editar(id, { tipo }) {
    await EspecialidadesService.getById(id)
    if (await EspecialidadesModel.existeNombre(tipo, id)) throw duplicado()
    try {
      return await EspecialidadesModel.update(id, { tipo })
    } catch (error) {
      throw comoAppError(error)
    }
  }

  static async cambiarEstado(id, activo) {
    await EspecialidadesService.getById(id)
    return EspecialidadesModel.updateEstado(id, activo)
  }

  static async getProfesionales(id) {
    await EspecialidadesService.getById(id)
    return EspecialidadesModel.getProfesionales(id)
  }
}
