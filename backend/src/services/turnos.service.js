import { AppError } from "../utils/AppError.js"
import { TurnosModel } from "../models/turnos.model.js"
import { EmailMethods } from "../emails/email.methods.js"

export class TurnosService {

  static #assertOwnership(turno, requesterDni, requesterRol) {
    const isCliente = requesterRol === "cliente" && String(turno.dni_cliente) === String(requesterDni)
    const isProfesional = requesterRol === "profesional" && String(turno.dni_profesional) === String(requesterDni)
    if (!isCliente && !isProfesional) {
      throw new AppError("Acceso denegado.", 403, "FORBIDDEN")
    }
  }

  static async getTurnoById(id, requesterDni, requesterRol) {

    const turno = await TurnosModel.getTurnoById(id)

    if (!turno) {
      throw new AppError("Turno no encontrado.", 404, "NOT_FOUND")
    }

    this.#assertOwnership(turno, requesterDni, requesterRol)

    return turno
  }

  static async getTurnosByProfesional({ dni, desde, hasta, estado, requesterDni, requesterRol }) {
    if (requesterRol !== 'profesional' || String(requesterDni) !== String(dni)) {
      throw new AppError('Acceso denegado.', 403, 'FORBIDDEN')
    }
    return TurnosModel.getTurnosByProfesional({ dni, desde, hasta, estado })
  }

  static async cancelTurnoById(id, requesterDni, requesterRol, motivo) {

    const turno = await TurnosModel.getTurnoById(id)

    if (!turno) {
      throw new AppError("Turno no encontrado.", 404, "NOT_FOUND")
    }

    this.#assertOwnership(turno, requesterDni, requesterRol)

    if (turno.estado === 'cancelado') {
      throw new AppError("El turno ya fue cancelado.", 409, "ALREADY_CANCELLED")
    }

    if (turno.estado !== 'activo') {
      throw new AppError("Solo se puede cancelar un turno activo.", 409, "NOT_CANCELLABLE")
    }

    const turnoCancelado = await TurnosModel.cancelTurno(id, motivo)

    try {
      if (requesterRol === "profesional") {
        await EmailMethods.turnoCanceladoPorProfesional({ turno: turnoCancelado, motivo })
      } else {
        await EmailMethods.turnoCanceladoPorCliente({ turno: turnoCancelado })
      }
    } catch (err) {
      console.error("[email] Error al enviar aviso de cancelación:", err)
    }

    return turnoCancelado
  }

}