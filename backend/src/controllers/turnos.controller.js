import { TurnosService } from "../services/turnos.service.js"
import { TurnosModel } from "../models/turnos.model.js"
import { HorariosModel } from "../models/horarios.model.js"
import { ProfesionalesModel } from "../models/profesionales.model.js"
import { BloqueosModel } from "../models/bloqueos.model.js"
import {
  calcularSlotsDisponibles,
  estaDiaHabilitado,
  estaSlotBloqueado,
  reservaDemasiadoPronto,
  slotsDelDia,
} from "../utils/helperSlots.js"
import { ConfiguracionModel } from "../models/configuracion.model.js"
import { ESTADOS_TURNO, MAX_RANGE_DAYS } from "../config/constants.js"
import {
  crearTurnoSchema,
  cambiarEstadoSchema,
  reprogramarTurnoSchema,
  cancelarTurnoSchema,
  reasignarTurnoSchema,
} from "../schemas/turno.schema.js"
import { ClientesModel } from "../models/clientes.model.js"
import { AppError } from "../utils/AppError.js"
import { rangoMesActual } from "../utils/time.js"
import { emitTurnoCreado } from "../socket/events.js"

const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

const diffDias = (desde, hasta) => Math.round((new Date(hasta + 'T00:00:00') - new Date(desde + 'T00:00:00')) / 86400000) + 1;

const hoy = () => new Date().toISOString().slice(0, 10)
const enDias = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
const ESTADOS_VALIDOS = new Set(ESTADOS_TURNO)

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

  static async getTurnosAdmin(req, res, next) {
    try {
      const { desde, hasta, estado, profesional, cliente } = req.query
      const mes = rangoMesActual()
      const resolvedDesde = desde || mes.desde
      const resolvedHasta = hasta || mes.hasta

      if (!esFecha(resolvedDesde) || !esFecha(resolvedHasta)) {
        throw new AppError('"desde" and "hasta" must be valid dates (YYYY-MM-DD)', 400, 'VALIDATION_FAILED')
      }

      if (resolvedDesde > resolvedHasta) {
        throw new AppError('"desde" cannot be later than "hasta"', 400, 'VALIDATION_FAILED')
      }

      if (estado && estado !== 'abiertos' && !ESTADOS_VALIDOS.has(estado)) {
        throw new AppError(`"estado" must be one of: ${[...ESTADOS_VALIDOS].join(', ')}`, 400, 'VALIDATION_FAILED')
      }

      let dniProf = null
      if (profesional !== undefined && profesional !== '') {
        dniProf = Number(profesional)
        if (!Number.isFinite(dniProf) || dniProf <= 0) {
          throw new AppError('"profesional" must be a valid DNI', 400, 'VALIDATION_FAILED')
        }
      }

      const filtroCliente = typeof cliente === 'string' && cliente.trim() ? cliente.trim() : null

      const turnos = await TurnosService.getTurnosAdmin({
        desde: resolvedDesde,
        hasta: resolvedHasta,
        estado: estado || null,
        profesional: dniProf,
        cliente: filtroCliente,
      })

      return res.status(200).json(turnos)
    } catch (err) {
      next(err)
    }
  }

  static async getEventos(req, res, next) {
    try {
      const { profesional, desde, hasta } = req.query

      if (!profesional) {
        throw new AppError('"profesional" query param is required', 400, 'VALIDATION_FAILED');
      }

      const dni = Number(profesional)

      if (!Number.isFinite(dni) || dni <= 0) {
        throw new AppError('"profesional" must be a valid DNI', 400, 'VALIDATION_FAILED');
      }

      if ((desde !== undefined && !esFecha(desde)) || (hasta !== undefined && !esFecha(hasta))) {
        throw new AppError('"desde" and "hasta" must be valid dates (YYYY-MM-DD)', 400, 'VALIDATION_FAILED');
      }

      if (desde && hasta && desde > hasta) {
        throw new AppError('"desde" cannot be later than "hasta"', 400, 'VALIDATION_FAILED');
      }

      const eventos = await TurnosService.getEventosByProfesional({
        dni,
        desde,
        hasta,
        requesterDni: req.user.dni,
        requesterRol: req.user.role,
      })

      res.status(200).json(eventos)

    } catch (err) {
      next(err)
    }
  }

  static async getEventosTurno(req, res, next) {
    try {
      const eventos = await TurnosService.getEventosByTurno(req.params.id, req.user.dni, req.user.role)
      res.status(200).json(eventos)
    } catch (err) {
      next(err)
    }
  }

  static async cambiarEstado(req, res, next) {
    try {
      const parsed = cambiarEstadoSchema.safeParse(req.body ?? {})

      if (!parsed.success) {
        throw new AppError('invalid', 400, 'VALIDATION_FAILED', parsed.error.flatten().fieldErrors);
      }

      const turno = await TurnosService.cambiarEstado(req.params.id, parsed.data, req.user)
      res.status(200).json(turno)
    } catch (err) {
      next(err)
    }
  }

  static async completarPorAdmin(req, res, next) {
    try {
      const parsed = cancelarTurnoSchema.safeParse(req.body ?? {})
      if (!parsed.success) {
        throw new AppError('invalid', 400, 'VALIDATION_FAILED', parsed.error.flatten().fieldErrors)
      }

      const turno = await TurnosService.completarPorAdmin(req.params.id, parsed.data, req.user)
      return res.status(200).json(turno)
    } catch (err) {
      next(err)
    }
  }

  static async marcarAusentePorAdmin(req, res, next) {
    try {
      const parsed = cancelarTurnoSchema.safeParse(req.body ?? {})
      if (!parsed.success) {
        throw new AppError('invalid', 400, 'VALIDATION_FAILED', parsed.error.flatten().fieldErrors)
      }

      const turno = await TurnosService.marcarAusentePorAdmin(req.params.id, parsed.data, req.user)
      return res.status(200).json(turno)
    } catch (err) {
      next(err)
    }
  }

  static async reprogramar(req, res, next) {
    try {
      const parsed = reprogramarTurnoSchema.safeParse(req.body ?? {})

      if (!parsed.success) {
        throw new AppError('invalid', 400, 'VALIDATION_FAILED', parsed.error.flatten().fieldErrors);
      }

      const resultado = await TurnosService.reprogramar(req.params.id, parsed.data, req.user)
      res.status(201).json(resultado)
    } catch (err) {
      next(err)
    }
  }

  static async reasignar(req, res, next) {
    try {
      const parsed = reasignarTurnoSchema.safeParse(req.body ?? {})
      if (!parsed.success) {
        throw new AppError('invalid', 400, 'VALIDATION_FAILED', parsed.error.flatten().fieldErrors)
      }

      const turno = await TurnosService.reasignar(req.params.id, parsed.data, req.user)
      return res.status(200).json(turno)
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

    try {
      const parsed = cancelarTurnoSchema.safeParse(req.body ?? {})

      if (!parsed.success) {
        throw new AppError('invalid', 400, 'VALIDATION_FAILED', parsed.error.flatten().fieldErrors);
      }

      const turno = await TurnosService.cancelTurnoById(id, requesterDni, requesterRol, parsed.data.motivo)
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

      const [horarios, turnos, config, duracion, bloqueos] = await Promise.all([
        HorariosModel.getHorariosByProfesional({ dni }),
        TurnosModel.getTurnosOcupados({ dni, desde, hasta }),
        ConfiguracionModel.get(),
        ProfesionalesModel.getDuracionTurno(dni),
        BloqueosModel.getParaProfesional({ dni, desde, hasta }),
      ])
      const dias = calcularSlotsDisponibles({ horarios, turnos, desde, hasta, config, duracion, bloqueos });
      return res.json({ dni_profesional: dni, desde, hasta, duracion_min: duracion, dias });

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
        throw new AppError('dni_cliente es requerido cuando el rol es profesional o admin', 400, 'VALIDATION_FAILED');
      }

      const [existeProf, existeCli] = await Promise.all([
        ProfesionalesModel.existe({ dni: dni_profesional }),
        ClientesModel.existe({ dni: dni_cliente })
      ])

      if (!existeProf || !existeCli) {
        throw new AppError('profesional o cliente inexistente', 422, 'REFERENCE_NOT_FOUND');
      }

      const [horarios, config, duracion, bloqueos] = await Promise.all([
        HorariosModel.getHorariosByProfesional({ dni: dni_profesional }),
        ConfiguracionModel.get(),
        ProfesionalesModel.getDuracionTurno(dni_profesional),
        BloqueosModel.getParaProfesional({ dni: dni_profesional, desde: fecha_turno, hasta: fecha_turno }),
      ])

      // Políticas del centro (PLAN_ADMIN.md §11): la validación server-side es
      // la fuente de verdad, aunque los slots ya las reflejen.
      if (!estaDiaHabilitado(config, fecha_turno)) {
        throw new AppError('El centro permanece cerrado ese día.', 409, 'CENTER_CLOSED');
      }

      if (reservaDemasiadoPronto(fecha_turno, hora_turno, config)) {
        throw new AppError('Ese horario es demasiado próximo para reservar.', 409, 'BOOKING_TOO_SOON');
      }

      if (estaSlotBloqueado({ fecha: fecha_turno, hora: hora_turno, duracion, bloqueos })) {
        throw new AppError('El profesional tiene la agenda bloqueada en ese horario.', 409, 'AGENDA_BLOCKED');
      }

      if (!slotsDelDia({
        horarios: horarios, fecha: fecha_turno, duracion, config,
      }).includes(hora_turno)) {
        throw new AppError('the horarios is out of the profesional', 409, 'OUT_OF_SCHEDULE');
      }

      const idTurno = await TurnosService.crearTurno({ dni_profesional, dni_cliente, fecha_turno, hora_turno, actor: req.user })
      const [turno, detalle] = await Promise.all([
        TurnosModel.getById({ id: idTurno }),
        TurnosModel.getTurnoById(idTurno),
      ])

      emitTurnoCreado({
        id_turno: turno.id_turno,
        estado: turno.estado,
        fecha_turno: turno.fecha_turno,
        hora_turno: turno.hora_turno,
        ...(detalle
          ? {
              cliente: { dni: detalle.dni_cliente, nombre: detalle.c_nombre, apellido: detalle.c_apellido },
              profesional: { dni: detalle.dni_profesional, nombre: detalle.p_nombre, apellido: detalle.p_apellido },
            }
          : {}),
      })

      return res.status(201).json({ status: "success", data: turno });

    } catch (err) {
      next(err);
    }
  }

}