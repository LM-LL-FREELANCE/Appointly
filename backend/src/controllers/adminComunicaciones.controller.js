import { z } from "zod"
import { AdminComunicacionesService } from "../services/adminComunicaciones.service.js"
import { previewSegmentoSchema } from "../schemas/adminComunicaciones.schema.js"
import { AppError } from "../utils/AppError.js"

const badRequest = (parsed) => {
  const { formErrors, fieldErrors } = z.flattenError(parsed.error)
  return new AppError(formErrors[0] ?? "Datos de entrada inválidos.", 400, "BAD_REQUEST", fieldErrors)
}

export class AdminComunicacionesController {
  static async historial(req, res, next) {
    try {
      return res.json(await AdminComunicacionesService.listHistorial())
    } catch (error) {
      next(error)
    }
  }

  static async previewSegmento(req, res, next) {
    try {
      const parsed = previewSegmentoSchema.safeParse({
        tipo: req.params.tipo,
        desde: req.query.desde,
        hasta: req.query.hasta,
      })
      if (!parsed.success) throw badRequest(parsed)

      const { tipo, desde, hasta } = parsed.data
      return res.json(await AdminComunicacionesService.previewSegmento(tipo, { desde, hasta }))
    } catch (error) {
      next(error)
    }
  }

  static async individual(req, res, next) {
    try {
      const resultado = await AdminComunicacionesService.enviarIndividual(req.body, req.user.dni)
      return res.status(201).json(resultado)
    } catch (error) {
      next(error)
    }
  }

  static async masivo(req, res, next) {
    try {
      const resultado = await AdminComunicacionesService.enviarMasivo(req.body, req.user.dni)
      return res.status(201).json(resultado)
    } catch (error) {
      next(error)
    }
  }
}
