import { ESTADOS_TURNO } from "../config/constants.js"
import { AdminMetricasModel } from "../models/adminMetricas.model.js"
import { AdminUsuariosService } from "./adminUsuarios.service.js"
import { TurnosService } from "./turnos.service.js"
import { buildCSV } from "../utils/csv.js"
import { aFechaISO, ahoraEnTimezone, rangoMesActual } from "../utils/time.js"

function ultimosSeisPeriodos(fechaHoy) {
  const [y, m] = fechaHoy.split("-").map(Number)
  const periodos = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1))
    const py = d.getUTCFullYear()
    const pm = String(d.getUTCMonth() + 1).padStart(2, "0")
    periodos.push(`${py}-${pm}`)
  }
  return periodos
}

export class AdminMetricasService {
  static async obtenerMetricas({ desde, hasta } = {}) {
    const hoy = ahoraEnTimezone().fecha
    const mes = rangoMesActual()
    const rangoDesde = desde || mes.desde
    const rangoHasta = hasta || mes.hasta

    const periodos = ultimosSeisPeriodos(hoy)

    const [
      turnos_hoy,
      filasEstado,
      especialidades_top,
      profesionales_top,
      horas_pico,
      filasClientes,
    ] = await Promise.all([
      AdminMetricasModel.countTurnosEnFecha(hoy),
      AdminMetricasModel.countPorEstado({ desde: rangoDesde, hasta: rangoHasta }),
      AdminMetricasModel.getEspecialidadesTop({ desde: rangoDesde, hasta: rangoHasta }),
      AdminMetricasModel.getProfesionalesTop({ desde: rangoDesde, hasta: rangoHasta }),
      AdminMetricasModel.getHorasPico({ desde: rangoDesde, hasta: rangoHasta }),
      AdminMetricasModel.getNuevosClientesPorMes({ desdePeriodo: periodos[0] }),
    ])

    const por_estado = Object.fromEntries(ESTADOS_TURNO.map((e) => [e, 0]))
    let turnos_rango = 0
    for (const fila of filasEstado) {
      const cant = Number(fila.total ?? 0)
      if (fila.estado in por_estado) {
        por_estado[fila.estado] = cant
      }
      turnos_rango += cant
    }

    const tasa = (n) => (turnos_rango > 0 ? Math.round((n / turnos_rango) * 100) : 0)
    const tasas = {
      completitud: tasa(por_estado.completado),
      cancelacion: tasa(por_estado.cancelado),
      ausentismo: tasa(por_estado.ausente),
    }

    const mapaClientes = new Map(filasClientes.map((r) => [r.periodo, r.total]))
    const nuevos_clientes = periodos.map((periodo) => ({
      periodo,
      total: mapaClientes.get(periodo) ?? 0,
    }))

    return {
      rango: { desde: rangoDesde, hasta: rangoHasta },
      turnos_hoy,
      turnos_rango,
      por_estado,
      tasas,
      especialidades_top,
      profesionales_top,
      horas_pico,
      nuevos_clientes,
    }
  }

  static async exportarTurnosCSV(filtros = {}) {
    const mes = rangoMesActual()
    const desde = filtros.desde || mes.desde
    const hasta = filtros.hasta || mes.hasta

    const turnos = await TurnosService.getTurnosAdmin({
      ...filtros,
      desde,
      hasta,
    })

    const columnas = [
      { key: "id_turno", label: "ID Turno" },
      { label: "Fecha", get: (t) => aFechaISO(t.fecha_turno) },
      { label: "Hora", get: (t) => String(t.hora_turno ?? "").slice(0, 5) },
      { key: "estado", label: "Estado" },
      { key: "dni_cliente", label: "DNI Paciente" },
      { label: "Paciente", get: (t) => `${t.c_nombre ?? ""} ${t.c_apellido ?? ""}`.trim() },
      { key: "c_correo", label: "Correo Paciente" },
      { key: "c_telefono", label: "Teléfono Paciente" },
      { key: "dni_profesional", label: "DNI Profesional" },
      { label: "Profesional", get: (t) => `${t.p_nombre ?? ""} ${t.p_apellido ?? ""}`.trim() },
      {
        label: "Especialidades",
        get: (t) => (Array.isArray(t.especialidades) ? t.especialidades.join(" / ") : ""),
      },
      { key: "motivo_cancelacion", label: "Motivo Cancelación" },
    ]

    return {
      filename: `turnos_${desde}_${hasta}.csv`,
      csv: buildCSV(columnas, turnos),
    }
  }

  static async exportarUsuariosCSV(filtros = {}) {
    const usuarios = await AdminUsuariosService.list(filtros)

    const columnas = [
      { key: "dni", label: "DNI" },
      { key: "rol", label: "Rol" },
      { key: "nombre", label: "Nombre" },
      { key: "apellido", label: "Apellido" },
      { key: "correo", label: "Correo" },
      { key: "telefono", label: "Teléfono" },
      { key: "estado", label: "Estado" },
      {
        label: "Fecha Alta",
        get: (u) => (u.creado_en ? aFechaISO(u.creado_en) : ""),
      },
    ]

    return {
      filename: "usuarios.csv",
      csv: buildCSV(columnas, usuarios),
    }
  }
}
