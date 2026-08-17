import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { AuthModel } from "../models/auth.model.js"
import { ObraSocialesModel } from "../models/obra-sociales.model.js"
import { AppError } from "../utils/AppError.js"
import { isKnownRole } from "../utils/userPermission.js"
import { SALT_ROUNDS } from "../config/constants.js"

export class AuthService {

  static async login(dni, password, role) {
    const userFound = await AuthModel.findCredentialsByDniAndRole(dni, role)

    const isMatch = userFound && await bcrypt.compare(password, userFound.password_hash)

    if (!isMatch) throw new AppError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS')

    if (typeof userFound.role !== 'string' || userFound.role.length === 0) {
      throw new AppError('No se pudo determinar el rol de la cuenta.', 500, 'ROLE_RESOLUTION_FAILED')
    }

    const token = jwt.sign(
      { sub: userFound.dni, role: userFound.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    const user = {
      dni: userFound.dni,
      role: userFound.role,
      nombre: userFound.nombre,
      apellido: userFound.apellido,
      es_admin: userFound.role === "admin"
    }

    return { token, user }

  }

  static async getSession(dni, role) {

    if (!isKnownRole(role)) return null

    const userFound = await AuthModel.findCredentialsByDniAndRole(dni, role)
    if (!userFound) return null

    return {
      dni: userFound.dni,
      role: userFound.role,
      nombre: userFound.nombre,
      apellido: userFound.apellido,
      correo: userFound.correo,
      es_admin: userFound.es_admin
    }
  }

  static async registerCliente({ dni, correo, nombre, apellido, telefono, fecha_nacimiento, genero, password, id_obra_social, numero_afiliado }) {

    if (await AuthModel.existeDniCliente(dni)) {
      throw new AppError("Ya existe una cuenta con ese DNI.", 409, "DUPLICATE_DNI")
    }

    if (await AuthModel.existeCorreoCliente(correo)) {
      throw new AppError("Ya existe una cuenta con ese correo.", 409, "DUPLICATE_EMAIL")
    }

    if (id_obra_social != null) {
      const existeObraSocial = await ObraSocialesModel.existe({ id_obra_social })

      if (!existeObraSocial) {
        throw new AppError("La obra social indicada no existe.", 422, "REFERENCE_NOT_FOUND")
      }
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

    await AuthModel.createClienteAccount({
      data: {
        dni, nombre, apellido, correo, password_hash,
        telefono: telefono ?? null,
        fecha_nacimiento, genero,
        id_obra_social: id_obra_social ?? null,
        numero_afiliado: numero_afiliado ?? null
      }
    })

    return { dni, nombre, apellido, correo, fecha_nacimiento, genero, id_obra_social: id_obra_social ?? null }
  }

  static async registerProfesional({ dni, correo, nombre, apellido, telefono, fecha_nacimiento, genero, password }) {

    if (await AuthModel.existeDniProfesional(dni)) {
      throw new AppError("Ya existe una cuenta con ese DNI.", 409, "DUPLICATE_DNI")
    }

    if (await AuthModel.existeCorreoProfesional(correo)) {
      throw new AppError("Ya existe una cuenta con ese correo.", 409, "DUPLICATE_EMAIL")
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

    await AuthModel.createProfesionalAccount({
      data: {
        dni, nombre, apellido, correo, password_hash,
        telefono: telefono ?? null,
        fecha_nacimiento, genero
      }
    })

    return { dni, nombre, apellido, correo, fecha_nacimiento, genero }
  }

  static async forgotPassword({ correo, role }) {
    const userFound = await AuthModel.getDniByCorreo({ correo, role })

    if (!userFound) throw new AppError('Correo no encontrado', 404, 'INVALID_CORREO')

    const token = jwt.sign({ dni: userFound.dni_persona, role: role }, process.env.JWT_SECRET, {
      expiresIn: '10m'
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
      if (err instanceof AppError) throw err;

      throw new AppError("The link is no longer active or is not valid", 401, "INVALID_TOKEN");
    }
  }

}
