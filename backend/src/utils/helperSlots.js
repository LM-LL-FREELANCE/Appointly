import { SLOT_DURATION_MIN } from "../config/constants.js"
import { aFechaISO, ahoraEnTimezone, enMinutos, restarMinutosFechaHora } from "./time.js"

// Cálculo puro de disponibilidad (PLAN_ADMIN.md §11). Recibe la configuración
// del centro (`config`) para aplicar días hábiles, franja global y anticipación
// mínima; los llamadores son responsables de pasar la config vigente.

const pad = (n) => String(n).padStart(2, '0')

const toMinutes = (time) => {
  const [h, m] = String(time).slice(0, 5).split(":").map(Number)
  return (h * 60) + m
}
const toHour = (time) => `${pad(Math.floor(time / 60))}:${pad(time % 60)}`

const diaDeSemana = (fecha) => {
  const [y, m, d] = fecha.split("-").map(Number)
  return new Date(y, m - 1, d).getDay()
}
const rangoDeFechas = (desde, hasta) => {
  const [yd, md, dd] = desde.split("-").map(Number)
  const [yh, mh, dh] = hasta.split("-").map(Number)

  const fin = new Date(yh, mh - 1, dh)
  const fechas = []
  for (let current = new Date(yd, md - 1, dd); current <= fin; current.setDate(current.getDate() + 1)) {
    fechas.push(`${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`)
  }
  return fechas
}

const duracionValida = (duracion) => (
  Number.isFinite(duracion) && duracion > 0 ? duracion : SLOT_DURATION_MIN
)

const slotsDelBloque = (horaInicio, horaFin, duracion) => {
  const slots = []

  for (let t = toMinutes(horaInicio); t + duracion <= toMinutes(horaFin); t += duracion) {
    slots.push(toHour(t))
  }
  return slots
}

/** True cuando el día de `fecha` está dentro de `config.dias_habiles` (0=domingo). */
export const estaDiaHabilitado = (config, fecha) => {
  const dias = config?.dias_habiles

  if (!Array.isArray(dias) || dias.length === 0) return true
  return dias.map(Number).includes(diaDeSemana(fecha))
}

/** True cuando faltan menos de `anticipacion_reserva_min` minutos para el turno. */
export const reservaDemasiadoPronto = (fecha, hora, config, ahora = new Date()) => {
  const minutos = Number(config?.anticipacion_reserva_min ?? 0)
  if (!Number.isFinite(minutos) || minutos <= 0) return false

  const limite = enMinutos(minutos, ahora)
  return `${fecha}T${String(hora).slice(0, 5)}` <= `${limite.fecha}T${limite.hora}`
}

/** True cuando el turno ya entró en la ventana de no-cancelación (solo no-admin). */
export const cancelacionVencida = (
  fecha,
  hora,
  limiteHoras,
  ahora = ahoraEnTimezone(),
) => {
  const horas = Number(limiteHoras ?? 0)
  if (!Number.isFinite(horas) || horas <= 0) return false

  const limite = restarMinutosFechaHora(aFechaISO(fecha), hora, horas * 60)
  return `${limite.fecha}T${limite.hora}` < `${ahora.fecha}T${ahora.hora}`
}

/**
 * Bloques del día ya filtrados por día hábil y recortados a la franja global.
 * La intersección se calcula en minutos para tolerar TIME con segundos.
 */
const bloquesDelDia = ({ horarios, fecha, config }) => {
  if (!estaDiaHabilitado(config, fecha)) return []

  const dia = diaDeSemana(fecha)
  const apertura = config?.hora_apertura ? toMinutes(config.hora_apertura) : null
  const cierre = config?.hora_cierre ? toMinutes(config.hora_cierre) : null

  return horarios
    .filter((h) => h.dia_semana === dia)
    .map((h) => {
      const inicio = Math.max(toMinutes(h.hora_inicio), apertura ?? -Infinity)
      const fin = Math.min(toMinutes(h.hora_fin), cierre ?? Infinity)

      return inicio < fin
        ? { hora_inicio: toHour(inicio), hora_fin: toHour(fin) }
        : null
    })
    .filter(Boolean)
}

export const calcularSlotsDisponibles = ({
  horarios,
  turnos,
  desde,
  hasta,
  duracion = SLOT_DURATION_MIN,
  config = null,
}) => {
  const duracionMin = duracionValida(duracion)
  const porDia = new Map()
  for (const h of horarios) {
    if (!porDia.has(h.dia_semana)) porDia.set(h.dia_semana, [])
    porDia.get(h.dia_semana).push(h)
  }

  const ocupados = new Map()
  for (const t of turnos) {
    const hora = t.hora_turno.slice(0, 5)
    const fechaStr = t.fecha_turno instanceof Date
      ? `${t.fecha_turno.getFullYear()}-${pad(t.fecha_turno.getMonth() + 1)}-${pad(t.fecha_turno.getDate())}`
      : t.fecha_turno.toString().split("T")[0]
    if (!ocupados.has(fechaStr)) ocupados.set(fechaStr, new Set())
    ocupados.get(fechaStr).add(hora)
  }

  const limite = enMinutos(Number(config?.anticipacion_reserva_min ?? 0))
  const limiteStr = `${limite.fecha}T${limite.hora}`

  return rangoDeFechas(desde, hasta).map((fecha) => {
    const dia = diaDeSemana(fecha)
    const tomados = ocupados.get(fecha) || new Set()

    let slots = bloquesDelDia({ horarios: porDia.get(dia) || [], fecha, config })
      .flatMap((b) => slotsDelBloque(b.hora_inicio, b.hora_fin, duracionMin))
    slots = [...new Set(slots)].sort()
    slots = slots.filter((h) => !tomados.has(h))
    slots = slots.filter((h) => `${fecha}T${h}` > limiteStr)

    return { fecha, dia_semana: dia, slots }
  })
}

export const slotsDelDia = ({
  horarios,
  fecha,
  duracion = SLOT_DURATION_MIN,
  config = null,
}) => {
  const duracionMin = duracionValida(duracion)
  const slots = bloquesDelDia({ horarios, fecha, config })
    .flatMap((b) => slotsDelBloque(b.hora_inicio, b.hora_fin, duracionMin))

  return [...new Set(slots)].sort()
};
