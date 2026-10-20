import { z } from "zod"
import { AdminMetricasService } from "../services/adminMetricas.service.js"
import { metricasQuerySchema, reporteTurnosQuerySchema } from "../schemas/adminMetricas.schema.js"
import { listUsuariosQuerySchema } from "../schemas/adminUsuario.schema.js"
import { AppError } from "../utils/AppError.js"

const badRequest = (parsed) => {
  const { formErrors, fieldErrors } = z.flattenError(parsed.error)
  return new AppError(formErrors[0] ?? "Parámetros inválidos.", 400, "BAD_REQUEST", fieldErrors)
}

export class AdminMetricasController {
  static async obtenerMetricas(req, res, next) {
    try {
      const parsed = metricasQuerySchema.safeParse(req.query)
      if (!parsed.success) throw badRequest(parsed)

      const data = await AdminMetricasService.obtenerMetricas(parsed.data)
      return res.json(data)
    } catch (error) {
      next(error)
    }
  }

  static async exportarTurnosCSV(req, res, next) {
    try {
      const parsed = reporteTurnosQuerySchema.safeParse(req.query)
      if (!parsed.success) throw badRequest(parsed)

      const { filename, csv } = await AdminMetricasService.exportarTurnosCSV(parsed.data)
      res.setHeader("Content-Type", "text/csv; charset=utf-8")
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
      return res.status(200).send(csv)
    } catch (error) {
      next(error)
    }
  }

  static async exportarUsuariosCSV(req, res, next) {
    try {
      const parsed = listUsuariosQuerySchema.safeParse(req.query)
      if (!parsed.success) throw badRequest(parsed)

      const { filename, csv } = await AdminMetricasService.exportarUsuariosCSV(parsed.data)
      res.setHeader("Content-Type", "text/csv; charset=utf-8")
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
      return res.status(200).send(csv)
    } catch (error) {
      next(error)
    }
  }
}
