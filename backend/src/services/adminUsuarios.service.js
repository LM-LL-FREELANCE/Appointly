import { AdminUsuariosModel } from "../models/adminUsuarios.model.js"
import { AuthService } from "./auth.service.js"
import { AppError } from "../utils/AppError.js"
import { withTransaction } from "../config/db.js"

// WS1 — Gestion de usuarios y cuentas (PLAN §8.3, U1–U7).

const errorMatriculaDuplicada = () => new AppError(
  "Ya existe otro profesional con esa matricula.",
  409,
  "DUPLICATE_MATRICULA",
  { numero_matricula: ["Ya existe otro profesional con esa matricula."] },
)

const aTurno = (turno) => ({
  id_turno: turno.id_turno,
  fecha_turno: turno.fecha_turno,
  hora_turno: turno.hora_turno,
  estado: turno.estado,
  motivo_cancelacion: turno.motivo_cancelacion,
  contraparte: {
    dni: turno.contraparte_dni,
    nombre: turno.contraparte_nombre,
    apellido: turno.contraparte_apellido,
    foto_url: turno.contraparte_foto_url,
  },
})

export class AdminUsuariosService {
  /** U1: listado de cuentas con filtros opcionales por rol, estado y texto. */
  static list({ rol, estado, q } = {}) {
    return AdminUsuariosModel.list({ rol, estado, q: q || undefined })
  }

  /** Cuenta + perfil segun rol (sin historial). 404 si el par (dni, rol) no existe, aunque este dada de baja. */
  static async getCuenta(dni, rol) {
    const cuenta = await AdminUsuariosModel.getCuenta({ dni, rol })

    if (!cuenta) throw new AppError("No existe una cuenta con ese DNI y rol.", 404, "NOT_FOUND")

    const perfil = await AdminUsuariosModel.getPerfil({ dni, rol })

    return { ...cuenta, perfil }
  }

  /** U2: ficha completa (cuenta + perfil + ultimos 50 turnos). */
  static async getFicha(dni, rol) {
    const cuenta = await this.getCuenta(dni, rol)

    const turnos = rol === "admin" ? [] : await AdminUsuariosModel.getTurnos({ dni, rol })

    return { ...cuenta, turnos: turnos.map(aTurno) }
  }

  /** U3: edicion parcial por rol. Todo lo que toca la ficha va en una transaccion. */
  static async update(dni, rol, data) {
    await this.getCuenta(dni, rol)

    await withTransaction(async (conn) => {
      if (data.telefono !== undefined) {
        await AdminUsuariosModel.updateTelefono({ dni, telefono: data.telefono }, conn)
      }

      if (rol === "cliente") {
        const idObraSocial = await AdminUsuariosService.#resolverObraSocial(data.obra_social, conn)

        if (idObraSocial !== undefined || data.numero_afiliado !== undefined) {
          await AdminUsuariosModel.updateClientePerfil(
            { dni, id_obra_social: idObraSocial, numero_afiliado: data.numero_afiliado },
            conn,
          )
        }
      }

      if (rol === "profesional" && data.numero_matricula !== undefined) {
        if (await AdminUsuariosModel.matriculaEnUso({ dni, numero_matricula: data.numero_matricula }, conn)) {
          throw errorMatriculaDuplicada()
        }
      }

      if (rol === "profesional" && (data.numero_matricula !== undefined || data.duracion_turno_min !== undefined)) {
        try {
          await AdminUsuariosModel.updateProfesionalData(
            { dni, numero_matricula: data.numero_matricula, duracion_turno_min: data.duracion_turno_min },
            conn,
          )
        } catch (error) {
          // Carrera contra el UNIQUE de numero_matricula: el chequeo previo no alcanza solo.
          if (error?.code === "ER_DUP_ENTRY") throw errorMatriculaDuplicada()
          throw error
        }
      }
    })

    return this.getCuenta(dni, rol)
  }

  /** U4: suspende una cuenta activa. Repetir sobre una ya suspendida es 409. */
  static async suspender(dni, rol) {
    const cuenta = await this.getCuenta(dni, rol)

    if (cuenta.estado === "suspendida") {
      throw new AppError("La cuenta ya estaba suspendida.", 409, "ALREADY_SUSPENDED")
    }

    await AdminUsuariosModel.suspender({ dni, rol })

    return this.getCuenta(dni, rol)
  }

  /** U5: reactiva una cuenta suspendida o dada de baja. Sobre una activa es 409. */
  static async reactivar(dni, rol) {
    const cuenta = await this.getCuenta(dni, rol)

    if (cuenta.estado === "activa") {
      throw new AppError("La cuenta ya esta activa.", 409, "NOT_SUSPENDED")
    }

    await AdminUsuariosModel.reactivar({ dni, rol })

    return this.getCuenta(dni, rol)
  }

  /** U6: baja logica. Un admin no puede darse de baja a si mismo (mismo dni + rol). */
  static async darDeBaja({ dni, rol, actor }) {
    if (actor && String(actor.dni) === String(dni) && actor.role === rol) {
      throw new AppError("No podes dar de baja tu propia cuenta.", 409, "CANNOT_DELETE_SELF")
    }

    const cuenta = await this.getCuenta(dni, rol)

    // Repetir la baja es un no-op: los turnos y datos ya se conservaron en la primera.
    if (cuenta.estado === "baja") return false

    await AdminUsuariosModel.darDeBaja({ dni, rol })

    return true
  }

  /**
   * U7: genera el token de restablecimiento con el correo de la cuenta.
   * El envio del email queda en el controller (patron de auth/invitaciones).
   */
  static async prepararResetPassword(dni, rol) {
    const cuenta = await this.getCuenta(dni, rol)

    const token = await AuthService.forgotPassword({ correo: cuenta.correo, role: rol })

    return { correo: cuenta.correo, token }
  }

  /** Nombre o id -> id de obra social. Un nombre nuevo la crea (patron patchClienteData). */
  static async #resolverObraSocial(valor, conn) {
    if (valor === undefined) return undefined
    if (valor === null) return null

    if (typeof valor === "number") {
      const id = await AdminUsuariosModel.findObraSocialId({ id: valor }, conn)
      if (!id) throw new AppError("La obra social indicada no existe.", 422, "NOT_FOUND")
      return id
    }

    const existente = await AdminUsuariosModel.findObraSocialId({ nombre: valor }, conn)
    if (existente) return existente

    return AdminUsuariosModel.insertObraSocial(valor, conn)
  }
}
