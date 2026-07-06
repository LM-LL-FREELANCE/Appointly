import { TurnosService } from "../services/turnos.service.js"
import { TurnosModel } from "../models/turnos.model.js"
import { HorariosModel } from "../models/horarios.model.js"
import { ProfesionalesModel } from "../models/profesionales.model.js"
import { calcularSlotsDisponibles, slotsDelDia } from "../utils/helperSlots.js"
import { MAX_RANGE_DAYS, SLOT_DURATION_MIN } from "../config/constants.js"
import { crearTurnoSchema } from "../schema/turno.schema.js"
import { ClientesModel } from "../models/clientes.model.js"


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
    const { motivo } = req.body ?? {}

    try {
      const turno = await TurnosService.cancelTurnoById(id, requesterDni, requesterRol, motivo)
      res.status(200).json(turno)
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
      if (!(await ProfesionalesModel.existe({ dni }))) {
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

  static async crearTurno(req, res) {
    try {
      const parsedSchema = crearTurnoSchema.safeParse(req.body)
      if (!parsedSchema.success) {
        return res.status(400).json({ error: 'invalid', detalles: parsedSchema.error.flatten().fieldErrors });
      }
      const { dni_profesional, fecha_turno, hora_turno } = parsedSchema.data

      const dni_cliente = req.user.rol === 'cliente'
        ? Number(req.user.dni)
        : parsedSchema.data.dni_cliente

      if (!dni_cliente) {
        return res.status(400).json({ error: 'dni_cliente es requerido cuando el rol es profesional', code: 'VALIDATION_FAILED' })
      }

      const [existeProf, existeCli] = await Promise.all([
        ProfesionalesModel.existe({ dni: dni_profesional }),
        ClientesModel.existe({ dni: dni_cliente })
      ])
      if (!existeProf || !existeCli) {
        return res.status(422).json({ error: 'profesional o cliente inexistente', code: 'REFERENCE_NOT_FOUND' });
      }

      const horarios = await HorariosModel.getHorariosByProfesional({ dni: dni_profesional })

      if (!slotsDelDia({ horarios: horarios, fecha: fecha_turno }).includes(hora_turno)) {
        return res.status(409).json({ error: 'the horarios is out of the profesional', code: 'OUT_OF_SCHEDULE' });
      }

      if (await TurnosModel.existeActivo({ dni: dni_profesional, fecha: fecha_turno, hora: hora_turno })) {
        return res.status(409).json({ error: 'that turno has just been taken', code: 'SLOT_TAKEN' });
      }

      const idTurno = await TurnosModel.crearTurno({ dni_profesional, dni_cliente, fecha_turno, hora_turno })
      const turno = await TurnosModel.getById({ id: idTurno })
      return res.status(201).json({ status: "success", data: turno });
    } catch (err) {
      return res.status(500).json({ err: 'We could not arrange your turno', error: err.message });
    }
  }

  static async getAgenda(req, res, next) {
    const { profesional, desde, hasta, estado } = req.query

    if (!profesional || !desde || !hasta) {
      return res.status(400).json({ error: '"profesional", "desde" y "hasta" son obligatorios', code: 'VALIDATION_FAILED' })
    }
    if (!esFecha(desde) || !esFecha(hasta)) {
      return res.status(400).json({ error: 'las fechas deben tener formato YYYY-MM-DD', code: 'VALIDATION_FAILED' })
    }
    if (desde > hasta) {
      return res.status(400).json({ error: '"desde" no puede ser posterior a "hasta"', code: 'VALIDATION_FAILED' })
    }
    if (String(profesional) !== req.user.dni) {
      return res.status(403).json({ error: 'No podés ver la agenda de otro profesional', code: 'FORBIDDEN' })
    }

    try {
      const agenda = await TurnosModel.getAgenda({ dni_profesional: profesional, desde, hasta, estado })
      return res.status(200).json(agenda)
    } catch (err) {
      next(err)
    }
  }

}