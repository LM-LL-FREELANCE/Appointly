import { AppError } from "../utils/AppError.js"
import { TurnosModel } from "../models/turnos.model.js"
import { EmailMethods } from "../emails/email.methods.js"
import { HorariosModel } from "../models/horarios.model.js"
import { withTransaction } from "../config/db.js"
import { ahoraEnTimezone, esHoy, yaComenzo } from "../utils/time.js"
import {
  cancelacionVencida, estaDiaHabilitado, reservaDemasiadoPronto, slotsDelDia,
} from "../utils/helperSlots.js"
import { ConfiguracionModel } from "../models/configuracion.model.js"
import { ProfesionalesModel } from "../models/profesionales.model.js"
import { bestEffort } from "../utils/bestEffort.js"

const TODOS = ["cliente", "profesional", "admin"]
const ESTADOS_CANCELABLES = ["pendiente_confirmacion", "confirmado"]
// `ausente` is reprogrammed by booking a linked new turno; the original stays ausente.
const ESTADOS_REPROGRAMABLES = ["pendiente_confirmacion", "confirmado", "ausente"]

// Time rules of a transition, evaluated against "now" in TIMEZONE.
const REGLAS_TIEMPO = {
  hoy: {
    cumple: (turno, ahora) => esHoy(turno.fecha_turno, ahora),
    mensaje: "Solo se puede hacer el mismo día del turno.",
  },
  comenzado: {
    cumple: (turno, ahora) => yaComenzo(turno.fecha_turno, turno.hora_turno, ahora),
    mensaje: "El turno todavía no comenzó.",
  },
}

/**
 * Transition matrix for PATCH /turnos/:id/estado: TRANSICIONES[estadoNuevo][estadoOrigen].
 * `roles` can do it (a cliente only on their own turno, a profesional only on theirs,
 * an admin on any); `tiempo` names an optional rule of REGLAS_TIEMPO.
 */
export const TRANSICIONES = {
  confirmado: {
    pendiente_confirmacion: { roles: TODOS },
  },
  en_espera: {
    confirmado: { roles: ["profesional", "admin"], tiempo: "hoy" },
  },
  en_curso: {
    confirmado: { roles: ["profesional"], tiempo: "hoy" },
    en_espera: { roles: ["profesional"], tiempo: "hoy" },
  },
  ausente: {
    confirmado: { roles: ["profesional"], tiempo: "comenzado" },
    en_espera: { roles: ["profesional"], tiempo: "comenzado" },
  },
  completado: {
    en_curso: { roles: ["profesional"] },
    confirmado: { roles: ["profesional"], tiempo: "comenzado" },
    en_espera: { roles: ["profesional"], tiempo: "comenzado" },
  },
}

export class TurnosService {

  static #assertOwnership(turno, requesterDni, requesterRol) {
    const isCliente = requesterRol === "cliente" && String(turno.dni_cliente) === String(requesterDni)
    const isProfesional = requesterRol === "profesional" && String(turno.dni_profesional) === String(requesterDni)
    const isAdmin = requesterRol === "admin"
    if (!isCliente && !isProfesional && !isAdmin) {
      throw new AppError("Acceso denegado.", 403, "FORBIDDEN")
    }
  }

  static async #getTurnoOrFail(id) {
    const turno = await TurnosModel.getTurnoById(id)

    if (!turno) {
      throw new AppError("Turno no encontrado.", 404, "NOT_FOUND")
    }

    return turno
  }

  /**
   * Inside a transaction: runs the guarded UPDATE (`actualizar` must return the
   * affected rows) and writes the turno_evento row. STATE_CHANGED if another change won.
   */
  static async #aplicarCambio(conn, { turno, estadoNuevo, actor, motivo, actualizar }) {
    if (await actualizar(conn) !== 1) {
      throw new AppError("El turno cambió de estado mientras se procesaba la solicitud.", 409, "STATE_CHANGED")
    }

    await TurnosModel.insertEvento({
      id_turno: turno.id_turno,
      estado_anterior: turno.estado,
      estado_nuevo: estadoNuevo,
      dni_actor: Number(actor.dni),
      rol_actor: actor.role,
      motivo: motivo || null,
    }, conn)
  }

  static async #cambiarConEvento(params) {
    await withTransaction((conn) => this.#aplicarCambio(conn, params))
  }

  static async getTurnoById(id, requesterDni, requesterRol) {

    const turno = await this.#getTurnoOrFail(id)

    this.#assertOwnership(turno, requesterDni, requesterRol)

    return turno
  }

  static async getTurnosByProfesional({ dni, desde, hasta, estado, requesterDni, requesterRol }) {
    this.#assertProfesionalAccess(dni, requesterDni, requesterRol)
    return TurnosModel.getTurnosByProfesional({ dni, desde, hasta, estado })
  }

  static #assertProfesionalAccess(dni, requesterDni, requesterRol) {
    const isOwner = requesterRol === 'profesional' && String(requesterDni) === String(dni)
    if (requesterRol !== 'admin' && !isOwner) {
      throw new AppError('Acceso denegado.', 403, 'FORBIDDEN')
    }
  }

  static async cambiarEstado(id, { estado, motivo }, actor) {

    const turno = await this.#getTurnoOrFail(id)

    this.#assertOwnership(turno, actor.dni, actor.role)

    const regla = TRANSICIONES[estado]?.[turno.estado]

    if (!regla) {
      throw new AppError(`No se puede pasar un turno de ${turno.estado} a ${estado}.`, 409, "INVALID_TRANSITION")
    }

    if (!regla.roles.includes(actor.role)) {
      throw new AppError("Tu rol no puede realizar este cambio de estado.", 403, "FORBIDDEN")
    }

    if (regla.tiempo) {
      const { cumple, mensaje } = REGLAS_TIEMPO[regla.tiempo]
      if (!cumple(turno, ahoraEnTimezone())) {
        throw new AppError(mensaje, 409, "TOO_EARLY")
      }
    }

    await this.#cambiarConEvento({
      turno,
      estadoNuevo: estado,
      actor,
      motivo,
      actualizar: (conn) => TurnosModel.cambiarEstado({ id, estadoOrigen: turno.estado, estadoNuevo: estado }, conn),
    })

    return TurnosModel.getTurnoById(id)
  }

  static async cancelTurnoById(id, requesterDni, requesterRol, motivo) {

    const turno = await this.#getTurnoOrFail(id)

    this.#assertOwnership(turno, requesterDni, requesterRol)

    if (turno.estado === 'cancelado') {
      throw new AppError("El turno ya fue cancelado.", 409, "ALREADY_CANCELLED")
    }

    if (!ESTADOS_CANCELABLES.includes(turno.estado)) {
      throw new AppError("Solo se puede cancelar un turno pendiente de confirmaci��n o confirmado.", 409, "NOT_CANCELLABLE")
    }

    // Política del centro (PLAN_ADMIN.md §11.4): los admin pueden cancelar
    // siempre; cliente y profesional no, dentro de la ventana configurada.
    if (requesterRol !== "admin") {
      const config = await ConfiguracionModel.get()
      if (cancelacionVencida(turno.fecha_turno, turno.hora_turno, config.limite_cancelacion_horas)) {
        throw new AppError("Ya no estǭs a tiempo de cancelar este turno.", 409, "CANCEL_TOO_LATE")
      }
    }

    await this.#cambiarConEvento({
      turno,
      estadoNuevo: "cancelado",
      actor: { dni: requesterDni, role: requesterRol },
      motivo,
      actualizar: (conn) => TurnosModel.cancelTurno({ id, estadoOrigen: turno.estado, motivo }, conn),
    })

    const turnoCancelado = await TurnosModel.getTurnoById(id)

    try {
      if (requesterRol === "cliente") {
        await EmailMethods.turnoCanceladoPorCliente({ turno: turnoCancelado })
      } else {
        await EmailMethods.turnoCanceladoPorProfesional({ turno: turnoCancelado, motivo })
      }
    } catch (err) {
      console.error("[email] Error al enviar aviso de cancelación:", err)
    }

    return turnoCancelado
  }

  /**
   * Moves a turno to a new date/time: the original becomes `reprogramado` (or stays
   * `ausente`) and a linked `confirmado` turno is booked, all in one transaction that
   * first locks the professional's row so two bookings of the same slot cannot both pass.
   */
  static async reprogramar(id, { fecha_turno, hora_turno, motivo }, actor) {

    const turno = await this.#getTurnoOrFail(id)

    if (!["profesional", "admin"].includes(actor.role)) {
      throw new AppError("Acceso denegado.", 403, "FORBIDDEN")
    }
    this.#assertOwnership(turno, actor.dni, actor.role)

    if (!ESTADOS_REPROGRAMABLES.includes(turno.estado)) {
      throw new AppError("Solo se puede reprogramar un turno pendiente de confirmación, confirmado o ausente.", 409, "NOT_REPROGRAMMABLE")
    }

    const dni_profesional = turno.dni_profesional
    const [horarios, config, duracion] = await Promise.all([
      HorariosModel.getHorariosByProfesional({ dni: dni_profesional }),
      ConfiguracionModel.get(),
      ProfesionalesModel.getDuracionTurno(dni_profesional),
    ])

    if (!estaDiaHabilitado(config, fecha_turno)) {
      throw new AppError("El centro permanece cerrado ese d��a.", 409, "CENTER_CLOSED")
    }

    if (reservaDemasiadoPronto(fecha_turno, hora_turno, config)) {
      throw new AppError("Ese horario es demasiado pr��ximo para reprogramar.", 409, "BOOKING_TOO_SOON")
    }

    if (!slotsDelDia({ horarios, fecha: fecha_turno, duracion, config }).includes(hora_turno)) {
      throw new AppError("El horario estǭ fuera de la agenda del profesional.", 409, "OUT_OF_SCHEDULE")
    }

    const idNuevo = await withTransaction(async (conn) => {
      await TurnosModel.lockProfesional(dni_profesional, conn)

      // An ausente turno is recovered once: a live successor blocks another one. Under the
      // lock, so a double submit is serialized and the second attempt sees the first.
      if (turno.estado === "ausente" && await TurnosModel.existeSucesorOcupante(id, conn)) {
        throw new AppError("El turno ausente ya fue reprogramado.", 409, "ALREADY_REPROGRAMMED")
      }

      // Checked before touching the original, which still holds its own slot.
      if (await TurnosModel.existeOcupado({ dni: dni_profesional, fecha: fecha_turno, hora: hora_turno }, conn)) {
        throw new AppError("Ese horario ya fue tomado.", 409, "SLOT_TAKEN")
      }

      if (turno.estado !== "ausente") {
        await this.#aplicarCambio(conn, {
          turno,
          estadoNuevo: "reprogramado",
          actor,
          motivo,
          actualizar: (c) => TurnosModel.cambiarEstado({ id, estadoOrigen: turno.estado, estadoNuevo: "reprogramado" }, c),
        })
      }

      const nuevoId = await TurnosModel.crearTurno({
        dni_profesional,
        dni_cliente: turno.dni_cliente,
        fecha_turno,
        hora_turno,
        id_turno_origen: turno.id_turno,
      }, conn)

      await TurnosModel.insertEvento({
        id_turno: nuevoId,
        estado_anterior: null,
        estado_nuevo: "confirmado",
        dni_actor: Number(actor.dni),
        rol_actor: actor.role,
        motivo,
      }, conn)

      return nuevoId
    })

    const [original, nuevo] = await Promise.all([TurnosModel.getTurnoById(id), TurnosModel.getTurnoById(idNuevo)])

    // `turno` still holds the old date/time (read before the move).
    bestEffort(() => EmailMethods.turnoReprogramado({ original: turno, nuevo, motivo }))

    return { original, nuevo }
  }

  /**
   * Creates a `confirmado` turno and its initial event (estado_anterior NULL) atomically.
   * Takes the professional's row lock first and re-checks the slot under it, so concurrent
   * creates (or a create racing a reprogramación) cannot book the same slot.
   */
  static async crearTurno({ dni_profesional, dni_cliente, fecha_turno, hora_turno, actor }) {
    return withTransaction(async (conn) => {
      await TurnosModel.lockProfesional(dni_profesional, conn)

      if (await TurnosModel.existeOcupado({ dni: dni_profesional, fecha: fecha_turno, hora: hora_turno }, conn)) {
        throw new AppError("that turno has just been taken", 409, "SLOT_TAKEN")
      }

      const id = await TurnosModel.crearTurno({ dni_profesional, dni_cliente, fecha_turno, hora_turno }, conn)

      await TurnosModel.insertEvento({
        id_turno: id,
        estado_anterior: null,
        estado_nuevo: "confirmado",
        dni_actor: Number(actor.dni),
        rol_actor: actor.role,
      }, conn)

      return id
    })
  }

  static async getEventosByTurno(id, requesterDni, requesterRol) {

    const turno = await this.#getTurnoOrFail(id)

    // Clients never see the history, only the professional of the turno and admins.
    if (requesterRol === "cliente") {
      throw new AppError("Acceso denegado.", 403, "FORBIDDEN")
    }
    this.#assertOwnership(turno, requesterDni, requesterRol)

    return TurnosModel.getEventosByTurno(id)
  }

  static async getEventosByProfesional({ dni, desde, hasta, requesterDni, requesterRol }) {
    this.#assertProfesionalAccess(dni, requesterDni, requesterRol)
    return TurnosModel.getEventosByProfesional({ dni, desde, hasta })
  }

}
