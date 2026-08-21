import { AppError } from "../utils/AppError.js"
import { registerSchema, registerProfesionalSchema, passwordsSchema } from "../schemas/auth.schema.js"
import { AuthService } from "../services/auth.service.js"
import { cookieOptions } from "../validators/cookieOptions.js"
import { EmailMethods } from "../emails/email.methods.js"

export class AuthController {
  static async register(req, res, next) {

    try {
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
      const parsedSchema = registerProfesionalSchema.safeParse(req.body)

      if (!parsedSchema.success) {
        throw new AppError('invalid', 400, 'VALIDATION_FAILED', parsedSchema.error.flatten().fieldErrors);
      }

      const profesional = await AuthService.registerProfesional(parsedSchema.data)

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
      //await EmailMethods.sendTest()
      return res.json(user)

    } catch (error) {
      next(error)
    }
  }


  static async logout(req, res) {
    res.clearCookie("access_token", cookieOptions)
    res.status(204).end()
  }

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

  static async forgotPassword(req, res, next) {
    try {
      const { correo, role } = req.body

      const token = await AuthService.forgotPassword({ correo, role })

      const resetLink = `${process.env.WEB_FROM}/resetear-contraseña/${token}`

      await EmailMethods.resetPassWord({ correo, link: resetLink })

      return res.json({ success: true, msg: "mail sent" })

    } catch (err) {

      next(err)

    }
  }

  static async resetPassWord(req, res, next) {
    try {

      const parsedSchema = passwordsSchema.safeParse(req.body)

      if (!parsedSchema.success) {

        throw new AppError('invalid', 400, 'VALIDATION_FAILED', parsedSchema.error.flatten().fieldErrors);

      }

      const { password, token } = parsedSchema.data

      const changedPassWord = await AuthService.resetPassWord({ password, token })

      if (!changedPassWord) throw new AppError("We could not change your password", 400)

      return res.json({ success: true, msg: "your password was updated" })

    } catch (err) {
      next(err)
    }
  }

}