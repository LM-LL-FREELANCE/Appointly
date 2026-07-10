import { AuthModel } from "../models/auth.model.js"
import { ObraSocialesModel } from "../models/obra-sociales.model.js"
import { AppError } from "../utils/AppError.js"
import bcrypt from "bcrypt"
import { SALT_ROUNDS } from "../config/constants.js"
import { registerSchema } from "../schemas/auth.schema.js"

export class AuthController {
  static async register(req, res, next) {
    try {
      const parsedSchema = registerSchema.safeParse(req.body)
      if (!parsedSchema.success) {
        return res.status(400).json({ error: 'invalid', detalles: parsedSchema.error.flatten().fieldErrors });
      }
      const { dni, password, correo, nombre, apellido, fecha_nacimiento, genero, id_obra_social } = parsedSchema.data

      // El DNI es la identidad en ambas tablas: no puede existir ni como cliente ni como profesional
      if (await AuthModel.existeDni(dni)) {
        throw new AppError("Ya existe una cuenta con ese DNI.", 409, "DUPLICATE_DNI")
      }
      // El correo es UNIQUE en la tabla cliente: lo chequeamos antes para no filtrar el error de la DB
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
}