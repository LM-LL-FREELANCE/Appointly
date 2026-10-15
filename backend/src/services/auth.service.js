import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { AuthModel } from "../models/auth.model.js"
import { AppError } from "../utils/AppError.js"
import { isKnownRole } from "../utils/userPermission.js"
import { SALT_ROUNDS } from "../config/constants.js"

export class AuthService {
  static async login(dni, password, role) {
    const userFound = await AuthModel.findCredentialsByDniAndRole(dni, role)

    const isMatch = userFound && await bcrypt.compare(password, userFound.password_hash)

    if (!isMatch) throw new AppError("Credenciales inválidas", 401, "INVALID_CREDENTIALS")

    // Checked after the password on purpose: the account state is only revealed
    // to someone who proved they know the credentials.
    if (userFound.estado !== "aprobado") {
      throw new AppError("Tu cuenta todavía está pendiente de aprobación.", 403, "ACCOUNT_PENDING")
    }

    if (typeof userFound.role !== "string" || userFound.role.length === 0) {
      throw new AppError("No se pudo determinar el rol de la cuenta.", 500, "ROLE_RESOLUTION_FAILED")
    }

    const token = jwt.sign(
      { sub: userFound.dni, role: userFound.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )

    const user = {
      dni: userFound.dni,
      role: userFound.role,
      nombre: userFound.nombre,
      apellido: userFound.apellido,
      correo: userFound.correo,
      foto_url: userFound.foto_url,
      es_admin: userFound.role === "admin",
    }

    return { token, user }
  }

  static async getSession(dni, role) {
    if (!isKnownRole(role)) return null

    const userFound = await AuthModel.findCredentialsByDniAndRole(dni, role)
    if (!userFound || userFound.estado !== "aprobado") return null

    return {
      dni: userFound.dni,
      role: userFound.role,
      nombre: userFound.nombre,
      apellido: userFound.apellido,
      correo: userFound.correo,
      foto_url: userFound.foto_url,
      es_admin: userFound.role === "admin",
    }
  }

  static async forgotPassword({ correo, role }) {
    const userFound = await AuthModel.getDniByCorreo({ correo, role })

    if (!userFound) throw new AppError("Correo no encontrado", 404, "INVALID_CORREO")

    const token = jwt.sign({ dni: userFound.dni_persona, role: role }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    })

    return token
  }

  static async resetPassWord({ password, token }) {
    try {
      const verifiedToken = jwt.verify(token, process.env.JWT_SECRET)

      const { dni, role } = verifiedToken

      const password_hashed = await bcrypt.hash(password, SALT_ROUNDS)

      const updated = await AuthModel.resetPassWord({ dni, role, password_hashed })

      if (!updated) throw new AppError("We could not update your password", 400)

      return true
    } catch (err) {
      if (err instanceof AppError) throw err

      throw new AppError("The link is no longer active or is not valid", 401, "INVALID_TOKEN")
    }
  }

  static async verifyResetToken(token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET)
      return true
    } catch {
      throw new AppError("The link is no longer active or is not valid", 401, "INVALID_TOKEN")
    }
  }
}
