import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { AuthModel } from "../models/auth.model.js"
import { AppError } from "../utils/AppError.js"
import { SALT_ROUNDS } from "../config/constants.js"

export class AuthService {

  static async login(dni, password, role) {
    const userFound = await AuthModel.findCredentialsByDniAndRole(dni, role)

    const isMatch = userFound && await bcrypt.compare(password, userFound.password_hash)

    if (!isMatch) throw new AppError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS')

    const token = jwt.sign(
      { sub: userFound.dni, role: userFound.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    const user = {
      dni: userFound.dni,
      role: userFound.role,
      nombre: userFound.nombre,
      apellido: userFound.apellido
    }

    return { token, user }

  }

  static async getMe(dni, role) {

    const userFound = await AuthModel.findCredentialsByDniAndRole(dni, role)
    if (!userFound) throw new AppError('Sesión inválida.', 401, 'UNAUTHORIZED')

    const { password_hash, ...user } = userFound

    return user
  }

  static async registerProfesional({ dni, correo, nombre, apellido, fecha_nacimiento, genero, password }) {

    if (await AuthModel.existeDni(dni)) {
      throw new AppError("Ya existe una cuenta con ese DNI.", 409, "DUPLICATE_DNI")
    }

    if (await AuthModel.existeCorreoProfesional(correo)) {
      throw new AppError("Ya existe una cuenta con ese correo.", 409, "DUPLICATE_EMAIL")
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

    await AuthModel.createProfesionalAccount({ dni, password_hash, correo, nombre, apellido, fecha_nacimiento, genero })

    return { dni, nombre, apellido, correo, fecha_nacimiento, genero }
  }

}
