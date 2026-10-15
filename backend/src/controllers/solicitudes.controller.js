import { z } from "zod"
import { AppError } from "../utils/AppError.js"
import { SolicitudesService } from "../services/solicitudes.service.js"
import { solicitudParamsSchema } from "../schemas/solicitud.schema.js"
import { EmailMethods } from "../emails/email.methods.js"
import { bestEffort } from "../utils/bestEffort.js"

export class SolicitudesController {
  static async list(req, res, next) {
    try {
      return res.json(await SolicitudesService.listPendientes())
    } catch (error) {
      next(error)
    }
  }

  static async resolver(req, res, next) {
    try {
      const params = solicitudParamsSchema.safeParse(req.params)

      if (!params.success) {
        const { formErrors, fieldErrors } = z.flattenError(params.error)
        throw new AppError("Datos de entrada inválidos.", 400, "BAD_REQUEST", { formErrors, fieldErrors })
      }

      const { dni, role } = params.data
      const resultado = await SolicitudesService.resolver({ dni, role, accion: req.body.accion })

      bestEffort(() => EmailMethods.solicitudResuelta({
        correo: resultado.correo, nombre: resultado.nombre, accion: resultado.accion,
      }))

      return res.json({ dni: resultado.dni, role: resultado.role, accion: resultado.accion })
    } catch (error) {
      next(error)
    }
  }
}
