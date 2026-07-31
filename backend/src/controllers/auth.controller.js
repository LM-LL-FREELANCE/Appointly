import { AuthModel } from "../models/auth.model.js"
import { ObraSocialesModel } from "../models/obra-sociales.model.js"
import { AppError } from "../utils/AppError.js"
import bcrypt from "bcrypt"
import { SALT_ROUNDS } from "../config/constants.js"
import { registerSchema } from "../schemas/auth.schema.js"
import { AuthService } from "../services/auth.service.js"
import { cookieOptions } from "../validators/cookieOptions.js"

export class AuthController {
  static async register(req, res, next) {

    try {
      const parsedSchema = registerSchema.safeParse(req.body)

      if (!parsedSchema.success) {
        throw new AppError('invalid', 400, 'VALIDATION_FAILED', parsedSchema.error.flatten().fieldErrors);
      }

      const { dni, password, correo, nombre, apellido, fecha_nacimiento, genero, id_obra_social } = parsedSchema.data

      if (await AuthModel.existeDni(dni)) {
        throw new AppError("Ya existe una cuenta con ese DNI.", 409, "DUPLICATE_DNI")
      }

      if (await AuthModel.existeCorreo(correo)) {
        throw new AppError("Ya existe una cuenta con ese correo.", 409, "DUPLICATE_EMAIL")
      }

      if (id_obra_social) {
        const existeObraSocial = await ObraSocialesModel.existe({ id_obra_social })

        if (!existeObraSocial) {
          throw new AppError("La obra social indicada no existe.", 422, "REFERENCE_NOT_FOUND")
        }
      }

      const password_hashed = await bcrypt.hash(password, SALT_ROUNDS)

      await AuthModel.createAccount({ dni, password_hash: password_hashed, correo, nombre, apellido, fecha_nacimiento, genero, id_obra_social: id_obra_social ?? null })

      res.set("Location", `/api/clientes/${dni}`)

      return res.status(201).json({ dni, nombre, apellido, correo, fecha_nacimiento, genero, id_obra_social })

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
      res.json(user)

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

    const { dni, role } = req.user

    try {
      const user = await AuthService.getMe(dni, role)
      res.json(user)

    } catch (error) {
      next(error)
    }
  }

}