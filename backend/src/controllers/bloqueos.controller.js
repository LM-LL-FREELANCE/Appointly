import { BloqueosService } from "../services/bloqueos.service.js"
import { idBloqueoSchema } from "../schemas/bloqueos.schema.js"
import { AppError } from "../utils/AppError.js"

const parseId = (value) => {
  const id = idBloqueoSchema.safeParse(value)
  if (!id.success) throw new AppError("Id de bloqueo inválido.", 400, "BAD_REQUEST")
  return id.data
}

export class BloqueosController {
  static async listar(req, res, next) {
    try {
      const bloqueos = await BloqueosService.listar(req.query)
      return res.json(bloqueos)
    } catch (err) {
      next(err)
    }
  }

  static async crear(req, res, next) {
    try {
      const creados = await BloqueosService.crear(req.body, req.user)
      return res.status(201).json(creados)
    } catch (err) {
      next(err)
    }
  }

  static async eliminar(req, res, next) {
    try {
      await BloqueosService.eliminar(parseId(req.params.id))
      return res.status(204).end()
    } catch (err) {
      next(err)
    }
  }
}
