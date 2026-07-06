import { AppError } from "../utils/AppError.js"
import { TurnosModel } from "../models/turnos.model.js"
import { EmailService } from "./email.service.js"

export class TurnosService {

  static #assertOwnership(turno, requesterDni, requesterRol) {
    const isCliente = requesterRol === "cliente" && String(turno.dni_cliente) === requesterDni
    const isProfesional = requesterRol === "profesional" && String(turno.dni_profesional) === requesterDni
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

<<<<<<< HEAD
  static async cancelTurnoById(id, requesterDni, requesterRol, motivo) {
=======
  static async getTurnosByProfesional({ dni, desde, hasta, estado, requesterDni, requesterRol }) {
    if (requesterRol !== 'profesional' || String(requesterDni) !== String(dni)) {
      throw new AppError('Acceso denegado.', 403, 'FORBIDDEN')
    }
    return TurnosModel.getTurnosByProfesional({ dni, desde, hasta, estado })
  }

  static async cancelTurnoById(id, requesterDni, requesterRol) {
>>>>>>> 6c68bbb (chore: fetchind data to Dashboard.jsx)

    const turno = await TurnosModel.getTurnoById(id)

    if (!turno) {
      throw new AppError("Turno no encontrado.", 404, "NOT_FOUND")
    }

    this.#assertOwnership(turno, requesterDni, requesterRol)

    if (turno.estado === 'cancelado') {
      throw new AppError("El turno ya fue cancelado.", 409, "ALREADY_CANCELLED")
    }

    const turnoCancelado = await TurnosModel.cancelTurno(id)

    // Aviso por email (hoy es un stub; ver EmailService). No bloquea la
    // respuesta: si fallara el envío, la cancelación ya quedó hecha igual.
    try {
      if (requesterRol === "profesional") {
        await EmailService.turnoCanceladoPorProfesional({ turno: turnoCancelado, motivo })
      } else {
        await EmailService.turnoCanceladoPorCliente({ turno: turnoCancelado })
      }
    } catch (err) {
      console.error("[email] Error al enviar aviso de cancelación:", err)
    }

    return turnoCancelado
  }

}