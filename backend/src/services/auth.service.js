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

    // The model sets role as a literal per role table, so this should be
    // unreachable. It stays as a guard because an undefined role claim used to
    // ship silently in the token and every authorization check reads it.
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
      es_admin: userFound.es_admin
    }

    return { token, user }

  }

  // Session probe for GET /api/auth/me. Returns null instead of throwing when
  // the token cannot be resolved to a live account: an unknown role (a token
  // issued before roles were scoped per table) or an account that no longer
  // exists both mean "not logged in", not "request failed". Infrastructure
  // errors still propagate, so a database outage is never reported as a
  // logged-out session.
  static async getSession(dni, role) {

    if (!isKnownRole(role)) return null

    const userFound = await AuthModel.findCredentialsByDniAndRole(dni, role)
    if (!userFound) return null

    // Built field by field rather than by rest-spreading the row, so
    // password_hash cannot leak into the session response.
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

    // Coherence between numero_afiliado and id_obra_social is enforced at the
    // zod boundary; this only resolves the foreign key.
    if (id_obra_social != null) {
      const existeObraSocial = await ObraSocialesModel.existe({ id_obra_social })

      if (!existeObraSocial) {
        throw new AppError("La obra social indicada no existe.", 422, "REFERENCE_NOT_FOUND")
      }
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

    await AuthModel.createClienteAccount({
      dni, nombre, apellido, correo, password_hash,
      telefono: telefono ?? null,
      fecha_nacimiento, genero,
      id_obra_social: id_obra_social ?? null,
      numero_afiliado: numero_afiliado ?? null
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
      dni, nombre, apellido, correo, password_hash,
      telefono: telefono ?? null,
      fecha_nacimiento, genero
    })

    return { dni, nombre, apellido, correo, fecha_nacimiento, genero }
  }

}
