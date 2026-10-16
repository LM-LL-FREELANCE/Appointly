import { InvitacionesService } from "../services/invitaciones.service.js"
import { EmailMethods } from "../emails/email.methods.js"
import { idInvitacionSchema } from "../schemas/invitacion.schema.js"
import { buildInvitacionLink } from "../utils/invitacionLink.js"
import { AppError } from "../utils/AppError.js"

export class InvitacionesController {
  static async crear(req, res, next) {
    try {
      const { dni, correo, role = "admin" } = req.body
      const invitacion = await InvitacionesService.emitir({ dni, correo, role, creadoPor: req.user.dni })

      try {
        await EmailMethods.invitacion({
          correo,
          role: invitacion.role,
          link: buildInvitacionLink(invitacion.token, invitacion.role),
          horas: invitacion.horas,
        })
      } catch (mailError) {
        // The link never reached anyone: do not leave a live token behind.
        await InvitacionesService.revocar(invitacion.id).catch(() => {})
        console.error(mailError)
        throw new AppError("No pudimos enviar el correo de invitación.", 502, "EMAIL_SEND_FAILED")
      }

      // The token is never returned: it only travels by email.
      return res.status(201).json({ id: invitacion.id, dni, correo, role: invitacion.role, horas: invitacion.horas })
    } catch (error) {
      next(error)
    }
  }

  static async list(req, res, next) {
    try {
      return res.json(await InvitacionesService.list())
    } catch (error) {
      next(error)
    }
  }

  static async revocar(req, res, next) {
    try {
      const id = idInvitacionSchema.safeParse(req.params.id)
      if (!id.success) throw new AppError("Id de invitación inválido.", 400, "BAD_REQUEST")

      await InvitacionesService.revocar(id.data)
      return res.status(204).end()
    } catch (error) {
      next(error)
    }
  }

  static async validar(req, res, next) {
    try {
      return res.json(await InvitacionesService.validar(req.params.token))
    } catch (error) {
      next(error)
    }
  }

  static async aceptar(req, res, next) {
    try {
      const account = await InvitacionesService.aceptar(req.params.token, req.body)
      return res.status(201).json(account)
    } catch (error) {
      next(error)
    }
  }
}
