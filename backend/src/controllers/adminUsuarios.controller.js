import { z } from "zod"
import { AppError } from "../utils/AppError.js"
import { EmailMethods } from "../emails/email.methods.js"
import { AdminUsuariosService } from "../services/adminUsuarios.service.js"
import {
  dniUsuarioSchema,
  listUsuariosQuerySchema,
  rolUsuarioSchema,
  updateSchemaPorRol,
} from "../schemas/adminUsuario.schema.js"

// WS1 — Gestion de usuarios y cuentas (PLAN §8.3, U1–U7).

const parseCuentaParams = (req) => {
  const dni = dniUsuarioSchema.safeParse(req.params.dni)
  const rol = rolUsuarioSchema.safeParse(req.params.rol)

  if (!dni.success || !rol.success) {
    throw new AppError("El DNI o el rol de la cuenta no son validos.", 400, "BAD_REQUEST")
  }

  return { dni: dni.data, rol: rol.data }
}

const errorDeValidacion = (error, mensaje = "Datos de entrada inválidos.") => {
  const { formErrors, fieldErrors } = z.flattenError(error)

  // Una clave ajena al rol (strictObject) no tiene path: zod la deja en
  // formErrors. La mapeamos al campo para que el form la muestre en el input.
  for (const issue of error.issues) {
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) fieldErrors[key] = [issue.message]
    }
  }

  return new AppError(formErrors[0] ?? mensaje, 400, "BAD_REQUEST", fieldErrors)
}

export class AdminUsuariosController {
  static async list(req, res, next) {
    try {
      const parsed = listUsuariosQuerySchema.safeParse(req.query)
      if (!parsed.success) throw errorDeValidacion(parsed.error, "Filtros inválidos.")

      return res.json(await AdminUsuariosService.list(parsed.data))
    } catch (error) {
      next(error)
    }
  }

  static async getFicha(req, res, next) {
    try {
      const { dni, rol } = parseCuentaParams(req)

      return res.json(await AdminUsuariosService.getFicha(dni, rol))
    } catch (error) {
      next(error)
    }
  }

  static async update(req, res, next) {
    try {
      const { dni, rol } = parseCuentaParams(req)

      // El schema depende del rol del path: no puede ir en el middleware validate().
      const parsed = updateSchemaPorRol[rol].safeParse(req.body ?? {})
      if (!parsed.success) throw errorDeValidacion(parsed.error)

      return res.json(await AdminUsuariosService.update(dni, rol, parsed.data))
    } catch (error) {
      next(error)
    }
  }

  static async suspender(req, res, next) {
    try {
      const { dni, rol } = parseCuentaParams(req)

      return res.json(await AdminUsuariosService.suspender(dni, rol))
    } catch (error) {
      next(error)
    }
  }

  static async reactivar(req, res, next) {
    try {
      const { dni, rol } = parseCuentaParams(req)

      return res.json(await AdminUsuariosService.reactivar(dni, rol))
    } catch (error) {
      next(error)
    }
  }

  static async darDeBaja(req, res, next) {
    try {
      const { dni, rol } = parseCuentaParams(req)

      await AdminUsuariosService.darDeBaja({ dni, rol, actor: req.user })

      return res.status(204).end()
    } catch (error) {
      next(error)
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { dni, rol } = parseCuentaParams(req)

      const { correo, token } = await AdminUsuariosService.prepararResetPassword(dni, rol)
      const resetLink = `${process.env.WEB_FROM}/resetear-contraseña/${token}`

      try {
        await EmailMethods.resetPassWord({ correo, link: resetLink })
      } catch (mailError) {
        console.error(mailError)
        throw new AppError("No pudimos enviar el correo de restablecimiento.", 502, "EMAIL_SEND_FAILED")
      }

      return res.json({ success: true })
    } catch (error) {
      next(error)
    }
  }
}
