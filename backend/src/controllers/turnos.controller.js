import { TurnosService } from "../services/turnos.service.js"

export class TurnosController {

  static async getTurnoById(req, res, next) {
    const { id } = req.params
    const requesterDni = req.user.dni
    const requesterRol = req.user.rol

    try {
      const turno = await TurnosService.getTurnoById(id, requesterDni, requesterRol)
      res.status(200).json(turno)
    } catch (err) {
      next(err)
    }
  }

  static async cancelTurnoById(req, res, next) {
    const { id } = req.params
    const requesterDni = req.user.dni
    const requesterRol = req.user.rol

    try {
      await TurnosService.cancelTurnoById(id, requesterDni, requesterRol)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }

}