import { TurnosService } from "../services/turnos.service.js"
import { TurnosModel } from "../models/turnos.model.js"
import { HorariosModel } from "../models/horarios.model.js"
import { ProfesionalesModel } from "../models/profesionales.model.js"
import { calcularSlotsDisponibles } from "../utils/helperSlots.js"
import { MAX_RANGE_DAYS, SLOT_DURATION_MIN } from "../config/constants.js"
const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

const diffDias = (desde, hasta) => Math.round((new Date(hasta + 'T00:00:00') - new Date(desde + 'T00:00:00')) / 86400000) + 1;



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

  static async getSlots(req, res) {
    try {
      const dni = Number(req.params.dni)
      const { desde, hasta } = req.query
      if (!esFecha(desde) || !esFecha(hasta)) {
        return res.status(400).json({ error: 'the dates "desde" and "hasta" must be valid dates (YYYY-MM-DD)' });
      }
      if (desde > hasta) {
        return res.status(400).json({ error: 'the date "desde" cannot be later than "hasta"' });
      }
      if (diffDias(desde, hasta) > MAX_RANGE_DAYS) {
        return res.status(400).json({ error: `the range cannot exceed ${MAX_RANGE_DAYS} days` });
      }
      if (!(await ProfesionalesModel.existe(dni))) {
        return res.status(404).json({ error: 'profesional not found' });
      }
      const [horarios, turnos] = await Promise.all([
        HorariosModel.getHorariosByProfesional({ dni }),
        TurnosModel.getTurnosActivos({ dni, desde, hasta }),
      ])
      const dias = calcularSlotsDisponibles({ horarios, turnos, desde, hasta });
      return res.json({ dni_profesional: dni, desde, hasta, duracion_min: SLOT_DURATION_MIN, dias });
    } catch (err) {
      return res.status(500).json({ err: 'We could not get your slots in turnos', error: err.message });
    }
  }

}