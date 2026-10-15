import bcrypt from "bcrypt"
import { withTransaction } from "../config/db.js"
import { AuthModel } from "../models/auth.model.js"
import { ObraSocialesModel } from "../models/obra-sociales.model.js"
import { AppError } from "../utils/AppError.js"
import { SALT_ROUNDS } from "../config/constants.js"

/**
 * Per-role registration rules. Adding a role means adding one entry here:
 * - estadoInicial: 'aprobado' = active right away, 'pendiente' = waits for an admin.
 * - validar: role-specific checks that run before the transaction.
 * - insertPerfil: writes the role's subtype row (if any) inside the transaction.
 * - extra: role-specific fields echoed back in the response.
 */
const ROLES = {
  cliente: {
    estadoInicial: "aprobado",
    async validar({ id_obra_social }) {
      if (id_obra_social != null && !(await ObraSocialesModel.existe({ id_obra_social }))) {
        throw new AppError("La obra social indicada no existe.", 422, "REFERENCE_NOT_FOUND")
      }
    },
    insertPerfil: (data, db) => AuthModel.insertPerfilCliente(data, db),
    extra: ({ id_obra_social }) => ({ id_obra_social: id_obra_social ?? null }),
  },
  profesional: {
    estadoInicial: "pendiente",
    async validar({ numero_matricula }) {
      if (await AuthModel.existeMatricula({ numero_matricula })) {
        throw new AppError("Ya existe una cuenta con esa matrícula.", 409, "DUPLICATE_MATRICULA")
      }
    },
    insertPerfil: (data, db) => AuthModel.insertPerfilProfesional(data, db),
    extra: ({ numero_matricula }) => ({ numero_matricula }),
  },
  admin: {
    estadoInicial: "aprobado", // only created through an invitation, which is the authorization
    async validar() {},
    insertPerfil: async () => {}, // admin has no subtype table
    extra: () => ({}),
  },
}

// Fallback for two concurrent requests that both pass the pre-checks: the DB
// unique keys still reject the second one, and we report it like the pre-checks.
const toDuplicateError = (error) => {
  if (error?.code !== "ER_DUP_ENTRY") return error

  const detail = error.sqlMessage ?? ""
  if (detail.includes("numero_matricula")) return new AppError("Ya existe una cuenta con esa matrícula.", 409, "DUPLICATE_MATRICULA")
  if (detail.includes("uq_persona_rol_correo")) return new AppError("Ya existe una cuenta con ese correo.", 409, "DUPLICATE_EMAIL")
  return new AppError("Ya existe una cuenta con ese DNI.", 409, "DUPLICATE_DNI")
}

export class AccountService {
  static isRegistrableRole(role) {
    return Object.hasOwn(ROLES, role)
  }

  /**
   * Single entry point to create an account for any role.
   *
   * @param {object} params
   * @param {string} params.role - 'cliente' | 'profesional' | 'admin'
   * @param {object} params.data - validated payload for that role
   * @param {boolean} [params.identityVerified] - true when something else already
   *   proved who the requester is (an invitation token), so the existing-account
   *   password check is skipped.
   * @param {(db) => Promise<void>} [params.inTransaction] - runs first inside the
   *   same transaction (e.g. consuming an invitation token); if it throws, the
   *   whole registration rolls back.
   */
  static async register({ role, data, identityVerified = false, inTransaction }) {
    if (!AccountService.isRegistrableRole(role)) {
      throw new AppError("Rol inválido.", 400, "BAD_REQUEST")
    }

    const rules = ROLES[role]
    const { dni, correo, password, password_cuenta_existente } = data

    if (await AuthModel.existeCuenta({ dni, role })) {
      throw new AppError("Ya existe una cuenta con ese DNI.", 409, "DUPLICATE_DNI")
    }

    if (await AuthModel.existeCorreo({ correo, role })) {
      throw new AppError("Ya existe una cuenta con ese correo.", 409, "DUPLICATE_EMAIL")
    }

    await rules.validar(data)

    const personaExistente = await AuthModel.getPersona(dni)

    if (personaExistente && !identityVerified) {
      await AccountService.#verifyExistingIdentity(dni, password_cuenta_existente)
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
    const estado = rules.estadoInicial

    try {
      await withTransaction(async (db) => {
        await inTransaction?.(db)
        // For an existing person the stored personal data is kept untouched.
        if (!personaExistente) await AuthModel.insertPersona(data, db)
        await AuthModel.insertCuenta({ dni, correo, password_hash, role, estado }, db)
        await rules.insertPerfil(data, db)
      })
    } catch (error) {
      throw toDuplicateError(error)
    }

    return {
      dni,
      nombre: personaExistente?.nombre ?? data.nombre,
      apellido: personaExistente?.apellido ?? data.apellido,
      correo,
      role,
      estado,
      ...rules.extra(data),
    }
  }

  // A DNI that already belongs to a person can only get a new role if the
  // requester knows the password of one of that person's active accounts.
  static async #verifyExistingIdentity(dni, password) {
    if (!password) {
      throw new AppError(
        "Ese DNI ya tiene una cuenta. Ingresá la contraseña de tu cuenta existente para continuar.",
        403,
        "IDENTITY_VERIFICATION_REQUIRED"
      )
    }

    const cuentas = await AuthModel.getCuentasActivas(dni)
    const checks = await Promise.all(cuentas.map((c) => bcrypt.compare(password, c.password_hash)))

    if (!checks.some(Boolean)) {
      throw new AppError("No pudimos verificar tu identidad con esa contraseña.", 403, "IDENTITY_VERIFICATION_FAILED")
    }
  }
}
