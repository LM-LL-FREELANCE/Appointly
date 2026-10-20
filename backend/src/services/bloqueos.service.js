import { withTransaction } from "../config/db.js"
import { BloqueosModel } from "../models/bloqueos.model.js"
import { ProfesionalesModel } from "../models/profesionales.model.js"
import { crearBloqueoSchema, listarBloqueosQuerySchema } from "../schemas/bloqueos.schema.js"
import { AppError } from "../utils/AppError.js"
import { rangoMesActual } from "../utils/time.js"

export class BloqueosService {
  static async listar(query = {}) {
    const parsed = listarBloqueosQuerySchema.safeParse(query)
    if (!parsed.success) {
      throw new AppError(
        "Parámetros de búsqueda inválidos.",
        400,
        "VALIDATION_FAILED",
        parsed.error.flatten().fieldErrors,
      )
    }

    const mes = rangoMesActual()
    const desde = parsed.data.desde ?? mes.desde
    const hasta = parsed.data.hasta ?? mes.hasta
    if (desde > hasta) {
      throw new AppError('"desde" no puede ser posterior a "hasta".', 400, "VALIDATION_FAILED")
    }

    return BloqueosModel.getAll({
      desde,
      hasta,
      profesional: parsed.data.profesional,
    })
  }

  static async crear(payload, user) {
    const parsed = crearBloqueoSchema.safeParse(payload ?? {})
    if (!parsed.success) {
      throw new AppError(
        "Datos de bloqueo inválidos.",
        400,
        "VALIDATION_FAILED",
        parsed.error.flatten().fieldErrors,
      )
    }

    const { fechas, hora_inicio, hora_fin, dni_profesional, motivo } = parsed.data

    if (dni_profesional !== null) {
      const existe = await ProfesionalesModel.existe({ dni: dni_profesional })
      if (!existe) {
        throw new AppError("El profesional indicado no existe.", 422, "REFERENCE_NOT_FOUND")
      }
    }

    const creadoPor = user?.dni ? Number(user.dni) : null
    return withTransaction((conn) =>
      BloqueosModel.createMany(
        { fechas, hora_inicio, hora_fin, dni_profesional, motivo, creado_por: creadoPor },
        conn,
      ),
    )
  }

  static async eliminar(id) {
    const affected = await BloqueosModel.delete(id)
    if (affected === 0) {
      throw new AppError("Bloqueo no encontrado.", 404, "NOT_FOUND")
    }
  }
}
