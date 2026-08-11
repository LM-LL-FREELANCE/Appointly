import { AppError } from "../utils/AppError.js"
import { registerSchema } from "../schemas/auth.schema.js"
import { AuthService } from "../services/auth.service.js"
import { cookieOptions } from "../validators/cookieOptions.js"
import { EmailMethods } from "../emails/email.js"

export class AuthController {
  static async register(req, res, next) {

    try {
      // Parsed here rather than through the validate() middleware on purpose:
      // validate() raises BAD_REQUEST with a different payload shape, and this
      // route's contract is VALIDATION_FAILED carrying fieldErrors.
      const parsedSchema = registerSchema.safeParse(req.body)

      if (!parsedSchema.success) {
        throw new AppError('invalid', 400, 'VALIDATION_FAILED', parsedSchema.error.flatten().fieldErrors);
      }

      const cliente = await AuthService.registerCliente(parsedSchema.data)

      res.set("Location", `/api/clientes/${cliente.dni}`)
      return res.status(201).json(cliente)

    } catch (error) {
      next(error)
    }
  }

  static async registerProfesional(req, res, next) {

    try {
      const profesional = await AuthService.registerProfesional(req.body)

      res.set("Location", `/api/profesionales/${profesional.dni}`)

      return res.status(201).json(profesional)

    } catch (error) {
      next(error)
    }
  }

  static async login(req, res, next) {
    const { dni, password, role } = req.body

    try {
      const { user, token } = await AuthService.login(dni, password, role)
      res.cookie("access_token", token, cookieOptions)
      await EmailMethods.sendTest()
      return res.json(user)

    } catch (error) {
      next(error)
    }
  }


  static async logout(req, res) {
    res.clearCookie("access_token", cookieOptions)
    res.status(204).end()
  }

  // Session probe, not a protected resource: it answers "who am I, if anyone".
  // A cookie that cannot be resolved to a live account is answered with null and
  // cleared, so the client recovers on its own instead of retrying a 4xx it can
  // never fix. This covers a token issued before roles were scoped per table and
  // a token whose account was dropped by a database reset.
  static async me(req, res, next) {

    if (!req.user) return res.json(null)

    try {
      const user = await AuthService.getSession(req.user.dni, req.user.role)

      if (!user) {
        res.clearCookie("access_token", cookieOptions)
        return res.json(null)
      }

      return res.json(user)

    } catch (error) {
      next(error)
    }
  }

  static async forgotPassword(req, res) {

  }

}