import { AuthModel } from "../models/auth.model.js"
import { ClientesModel } from "../models/clientes.model.js"
import ObraSocialModel from "../models/obra-sociales.model.js"
import AppError from "../utils/AppError.js"
import bcrypt from "bcrypt"
import { SALT_ROUNDS } from "../config/constants.js"

export class AuthController {
  static async register(req, res, next) {
    const { dni, password, correo, nombre, apellido, fecha_nacimiento, genero, id_obra_social } = req.body
    try {
      const existeAccount = await ClientesModel.existe({ dni })
      if (existeAccount) {
        throw new AppError("El cliente ya existe.", 409, "CLIENT_ALREADY_EXISTS")
      }
      if (id_obra_social) {
        const existeObraSocial = await ObraSocialModel.existe({ id_obra_social })
        if (!existeObraSocial) {
          throw new AppError("La obra social indicada no existe.", 422, "REFERENCE_NOT_FOUND")
        }
      }
      const password_hashed = await bcrypt.hash(password, SALT_ROUNDS)
      const result = await AuthModel.createAccount({ dni, password_hash: password_hashed, correo, nombre, apellido, fecha_nacimiento, genero, id_obra_social })
      return res.status(201).json({ status: "success", message: "Cliente registrado exitosamente", clienteId: result.insertId })
    } catch (error) {
      next(error)
    }
  }
}