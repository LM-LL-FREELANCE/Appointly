import { TurnosService } from "../services/turnos.service.js"
import { TurnosModel } from "../models/turnos.model.js"
import { HorariosModel } from "../models/horarios.model.js"
import { ProfesionalesModel } from "../models/profesionales.model.js"
import { calcularSlotsDisponibles, slotsDelDia } from "../utils/helperSlots.js"
import { MAX_RANGE_DAYS, SLOT_DURATION_MIN } from "../config/constants.js"
import { crearTurnoSchema } from "../schemas/turno.schema.js"
import { ClientesModel } from "../models/clientes.model.js"
import { AppError } from "../utils/AppError.js"

const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

const diffDias = (desde, hasta) => Math.round((new Date(hasta + 'T00:00:00') - new Date(desde + 'T00:00:00')) / 86400000) + 1;

const hoy = () => new Date().toISOString().slice(0, 10)
const enDias = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
const ESTADOS_VALIDOS = new Set(['activo', 'cancelado', 'completado'])

export class TurnosController {

  static async getTurnos(req, res, next) {

    try {
      const { profesional, desde, hasta, estado } = req.query

      if (!profesional) {
        throw new AppError('"profesional" query param is required', 400, 'VALIDATION_FAILED');
      }

      const dni = Number(profesional)

      if (!Number.isFinite(dni) || dni <= 0) {
        throw new AppError('"profesional" must be a valid DNI', 400, 'VALIDATION_FAILED');
      }

      const resolvedDesde = desde ?? hoy()
      const resolvedHasta = hasta ?? enDias(6)

      if (!esFecha(resolvedDesde) || !esFecha(resolvedHasta)) {
        throw new AppError('"desde" and "hasta" must be valid dates (YYYY-MM-DD)', 400, 'VALIDATION_FAILED');
      }

      if (resolvedDesde > resolvedHasta) {
        throw new AppError('"desde" cannot be later than "hasta"', 400, 'VALIDATION_FAILED');
      }

      if (estado && !ESTADOS_VALIDOS.has(estado)) {
        throw new AppError(`"estado" must be one of: ${[...ESTADOS_VALIDOS].join(', ')}`, 400, 'VALIDATION_FAILED');
      }

      const turnos = await TurnosService.getTurnosByProfesional({
        dni,
        desde: resolvedDesde,
        hasta: resolvedHasta,
        estado: estado,
        requesterDni: req.user.dni,
        requesterRol: req.user.role,
      })

      res.status(200).json(turnos)

    } catch (err) {
      next(err)
    }
  }

  static async getTurnoById(req, res, next) {
    const { id } = req.params
    const requesterDni = req.user.dni
    const requesterRol = req.user.role

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
    const requesterRol = req.user.role
    const { motivo } = req.body ?? {}

    try {
      const turno = await TurnosService.cancelTurnoById(id, requesterDni, requesterRol, motivo)
      res.status(200).json(turno)
    } catch (err) {
      next(err)
    }
  }

  static async getSlots(req, res, next) {

    try {
      const dni = Number(req.params.dni)
      const { desde, hasta } = req.query

      if (!esFecha(desde) || !esFecha(hasta)) {
        throw new AppError('the dates "desde" and "hasta" must be valid dates (YYYY-MM-DD)', 400, 'VALIDATION_FAILED');
      }

      if (desde > hasta) {
        throw new AppError('the date "desde" cannot be later than "hasta"', 400, 'VALIDATION_FAILED');
      }

      if (diffDias(desde, hasta) > MAX_RANGE_DAYS) {
        throw new AppError(`the range cannot exceed ${MAX_RANGE_DAYS} days`, 400, 'VALIDATION_FAILED');
      }

      if (!(await ProfesionalesModel.existe({ dni }))) {
        throw new AppError('profesional not found', 404, 'NOT_FOUND');
      }

      const [horarios, turnos] = await Promise.all([
        HorariosModel.getHorariosByProfesional({ dni }),
        TurnosModel.getTurnosActivos({ dni, desde, hasta }),
      ])
      const dias = calcularSlotsDisponibles({ horarios, turnos, desde, hasta });
      return res.json({ dni_profesional: dni, desde, hasta, duracion_min: SLOT_DURATION_MIN, dias });

    } catch (err) {
      next(err);
    }
  }

  static async crearTurno(req, res, next) {
    try {

      const parsedSchema = crearTurnoSchema.safeParse(req.body)

      if (!parsedSchema.success) {
        throw new AppError('invalid', 400, 'VALIDATION_FAILED', parsedSchema.error.flatten().fieldErrors);
      }
      const { dni_profesional, fecha_turno, hora_turno } = parsedSchema.data

      const dni_cliente = req.user.role === 'cliente'
        ? Number(req.user.dni)
        : parsedSchema.data.dni_cliente

      if (!dni_cliente) {
        throw new AppError('dni_cliente es requerido cuando el rol es profesional', 400, 'VALIDATION_FAILED');
      }

      const [existeProf, existeCli] = await Promise.all([
        ProfesionalesModel.existe({ dni: dni_profesional }),
        ClientesModel.existe({ dni: dni_cliente })
      ])

      if (!existeProf || !existeCli) {
        throw new AppError('profesional o cliente inexistente', 422, 'REFERENCE_NOT_FOUND');
      }

      const horarios = await HorariosModel.getHorariosByProfesional({ dni: dni_profesional })

      if (!slotsDelDia({ horarios: horarios, fecha: fecha_turno }).includes(hora_turno)) {
        throw new AppError('the horarios is out of the profesional', 409, 'OUT_OF_SCHEDULE');
      }

      if (await TurnosModel.existeActivo({ dni: dni_profesional, fecha: fecha_turno, hora: hora_turno })) {
        throw new AppError('that turno has just been taken', 409, 'SLOT_TAKEN');
      }

      const idTurno = await TurnosModel.crearTurno({ dni_profesional, dni_cliente, fecha_turno, hora_turno })
      const turno = await TurnosModel.getById({ id: idTurno })
      return res.status(201).json({ status: "success", data: turno });

    } catch (err) {
      next(err);
    }
  }

  /* static async getAgenda(req, res, next) {
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

    if (String(profesional) !== String(req.user.dni)) {
      return res.status(403).json({ error: 'No podés ver la agenda de otro profesional', code: 'FORBIDDEN' })
    }

    try {
      const agenda = await TurnosModel.getAgenda({ dni_profesional: profesional, desde, hasta, estado })
      return res.status(200).json(agenda)
    } catch (err) {
      next(err)
    }
  } */

}