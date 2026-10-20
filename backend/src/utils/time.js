import { TIMEZONE } from "../config/constants.js"

const pad = (n) => String(n).padStart(2, "0")

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

/** Date and time of an instant in TIMEZONE: { fecha: "YYYY-MM-DD", hora: "HH:MM" }. */
export const ahoraEnTimezone = (instante = new Date()) => {
  const parts = Object.fromEntries(formatter.formatToParts(instante).map((p) => [p.type, p.value]))
  return { fecha: `${parts.year}-${parts.month}-${parts.day}`, hora: `${parts.hour}:${parts.minute}` }
}

/** Same as ahoraEnTimezone, shifted `minutos` (may be negative) from `base`. */
export const enMinutos = (minutos, base = new Date()) =>
  ahoraEnTimezone(new Date(base.getTime() + minutos * 60_000))

/** Calendar arithmetic on a YYYY-MM-DD date (defaults to today in TIMEZONE). */
export const fechaEnDias = (dias, desde = ahoraEnTimezone().fecha) => {
  const [y, m, d] = desde.split("-").map(Number)
  const fecha = new Date(Date.UTC(y, m - 1, d + dias))
  return `${fecha.getUTCFullYear()}-${pad(fecha.getUTCMonth() + 1)}-${pad(fecha.getUTCDate())}`
}

/** Wall-clock arithmetic on a date + HH:MM pair (no DST: used for center policies). */
export const restarMinutosFechaHora = (fecha, hora, minutos) => {
  const [y, m, d] = String(fecha).slice(0, 10).split("-").map(Number)
  const [h, mi] = String(hora).slice(0, 5).split(":").map(Number)
  const base = new Date(Date.UTC(y, m - 1, d, h, mi))

  base.setUTCMinutes(base.getUTCMinutes() - minutos)
  return {
    fecha: `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}`,
    hora: `${pad(base.getUTCHours())}:${pad(base.getUTCMinutes())}`,
  }
}

/** Normalizes a DATE column value (mysql2 returns a local-midnight Date) to YYYY-MM-DD. */
export const aFechaISO = (valor) =>
  valor instanceof Date
    ? `${valor.getFullYear()}-${pad(valor.getMonth() + 1)}-${pad(valor.getDate())}`
    : String(valor).slice(0, 10)

export const esHoy = (fecha, ahora = ahoraEnTimezone()) => aFechaISO(fecha) === ahora.fecha

/** True when fecha+hora (HH:MM or HH:MM:SS) is at or before `ahora`, at minute precision. */
export const yaComenzo = (fecha, hora, ahora = ahoraEnTimezone()) =>
  `${aFechaISO(fecha)}T${String(hora).slice(0, 5)}` <= `${ahora.fecha}T${ahora.hora}`

/** True when the birthdate is at least 18 years before `ahora`. */
export const esMayorDeEdad = (fechaNacimiento, ahora = ahoraEnTimezone()) => {
  if (!fechaNacimiento) return false
  const fechaStr = aFechaISO(fechaNacimiento)
  const [yNac, mNac, dNac] = fechaStr.split("-").map(Number)
  const [yHoy, mHoy, dHoy] = ahora.fecha.split("-").map(Number)

  let edad = yHoy - yNac
  const diffMes = mHoy - mNac
  if (diffMes < 0 || (diffMes === 0 && dHoy < dNac)) {
    edad--
  }
  return edad >= 18
}
