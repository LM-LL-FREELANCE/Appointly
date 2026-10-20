import { AvisosService } from "../services/avisos.service.js"
import { idAvisoSchema } from "../schemas/avisos.schema.js"
import { AppError } from "../utils/AppError.js"

const parseId = (value) => {
  const id = idAvisoSchema.safeParse(value)
  if (!id.success) throw new AppError("Id de aviso inválido.", 400, "BAD_REQUEST")
  return id.data
}

export class AvisosController {
  static async getActivos(req, res, next) {
    try {
      return res.json(await AvisosService.getActivos())
    } catch (err) {
      next(err)
    }
  }

  static async getAll(req, res, next) {
    try {
      return res.json(await AvisosService.getAll())
    } catch (err) {
      next(err)
    }
  }

  static async crear(req, res, next) {
    try {
      return res.status(201).json(await AvisosService.crear(req.body, req.user))
    } catch (err) {
      next(err)
    }
  }

  static async editar(req, res, next) {
    try {
      return res.json(await AvisosService.editar(parseId(req.params.id), req.body))
    } catch (err) {
      next(err)
    }
  }

  static async eliminar(req, res, next) {
    try {
      await AvisosService.eliminar(parseId(req.params.id))
      return res.status(204).end()
    } catch (err) {
      next(err)
    }
  }
}
