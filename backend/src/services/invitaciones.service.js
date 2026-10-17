import { createHash, randomBytes } from "node:crypto"
import { z } from "zod"
import { InvitacionesModel } from "../models/invitaciones.model.js"
import { AuthModel } from "../models/auth.model.js"
import { AccountService } from "./account.service.js"
import { AppError } from "../utils/AppError.js"
import { INVITACION_TTL_HORAS } from "../config/constants.js"
import { datosPersonaSchema } from "../schemas/invitacion.schema.js"

const ROLES_INVITABLES = ["admin", "profesional"]

// Only the hash is stored: a leaked database does not leak usable links.
const hashToken = (token) => createHash("sha256").update(token).digest("hex")

export class InvitacionesService {
  /**
   * Creates an invitation bound to a DNI, a correo and a role (profesional | admin),
   * and returns the plain token (shown only once, to be sent to that correo).
   * Re-inviting the same DNI for the same role revokes previous pending invitations.
   */
  static async emitir({ dni, correo, role = "admin", creadoPor = null }) {
    if (!ROLES_INVITABLES.includes(role)) {
      throw new AppError("Rol de invitación inválido.", 400, "BAD_REQUEST")
    }

    if (await AuthModel.existeCuenta({ dni, role })) {
      const msg = role === "admin"
        ? "Esa persona ya tiene una cuenta de administrador."
        : "Esa persona ya tiene una cuenta de profesional."
      const code = role === "admin" ? "ADMIN_ALREADY_EXISTS" : "PROFESIONAL_ALREADY_EXISTS"
      throw new AppError(msg, 409, code)
    }

    if (await AuthModel.existeCorreo({ correo, role })) {
      throw new AppError("Ya existe una cuenta con ese correo para ese rol.", 409, "DUPLICATE_EMAIL")
    }

    await InvitacionesModel.revokePendientesByDni(dni, role)

    const token = randomBytes(32).toString("base64url")
    const id = await InvitacionesModel.insert({
      tokenHash: hashToken(token),
      dni,
      correo,
      role,
      creadoPor,
      ttlHoras: INVITACION_TTL_HORAS,
    })

    return { id, token, dni, correo, role, horas: INVITACION_TTL_HORAS }
  }

  static list() {
    return InvitacionesModel.list()
  }

  static async revocar(id) {
    if (!(await InvitacionesModel.revokeById(id))) {
      throw new AppError("No hay una invitación pendiente con ese id.", 404, "NOT_FOUND")
    }
  }

  /** Validates a token without consuming it. Returns what the form needs. */
  static async validar(token) {
    const invitacion = await InvitacionesService.#findValida(token)
    const persona = await AuthModel.getPersona(invitacion.dni)

    return {
      dni: invitacion.dni,
      correo: invitacion.correo,
      role: invitacion.role,
      persona: persona ? { nombre: persona.nombre, apellido: persona.apellido } : null,
    }
  }

  /**
   * Creates the account and consumes the token in ONE transaction: if
   * anything fails the token stays valid, and two requests with the same token
   * can never both succeed.
   */
  static async aceptar(token, { password, ...personal }) {
    const invitacion = await InvitacionesService.#findValida(token)
    const { dni, correo, role } = invitacion
    const persona = await AuthModel.getPersona(dni)

    let datosPersona = {}
    if (!persona) {
      const parsed = datosPersonaSchema.safeParse(personal)
      if (!parsed.success) {
        const { formErrors, fieldErrors } = z.flattenError(parsed.error)
        throw new AppError("Datos de entrada inválidos.", 400, "BAD_REQUEST", { formErrors, fieldErrors })
      }
      datosPersona = parsed.data
    }

    if (role === "profesional") {
      const matricula = String(personal.numero_matricula ?? "").trim()
      if (!matricula) {
        throw new AppError("La matrícula es obligatoria.", 400, "BAD_REQUEST", {
          fieldErrors: { numero_matricula: ["La matrícula es obligatoria"] },
        })
      }
      datosPersona.numero_matricula = matricula
    }

    const tokenHash = hashToken(token)

    return AccountService.register({
      role,
      data: { ...datosPersona, dni, correo, password },
      identityVerified: true,
      inTransaction: async (db) => {
        if (!(await InvitacionesModel.consume(tokenHash, db))) {
          throw new AppError("Esta invitación ya fue usada o venció.", 410, "INVITATION_USED")
        }
      },
    })
  }

  static async #findValida(token) {
    const invitacion = await InvitacionesModel.findByHash(hashToken(String(token ?? "")))

    if (!invitacion) throw new AppError("La invitación no es válida.", 404, "INVITATION_INVALID")
    if (invitacion.revocada) throw new AppError("La invitación fue revocada.", 410, "INVITATION_INVALID")
    if (invitacion.usada) throw new AppError("Esta invitación ya fue usada.", 410, "INVITATION_USED")
    if (invitacion.vencida) throw new AppError("La invitación venció.", 410, "INVITATION_EXPIRED")

    return invitacion
  }
}
