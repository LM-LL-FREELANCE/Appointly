const formatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fechaFormatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const formatFechaHora = (value) => (value ? formatter.format(new Date(value)) : '-')

// Fechas sin hora (fecha_nacimiento, vigencia de avisos): DATE de MySQL.
// `new Date('YYYY-MM-DD')` se interpreta como UTC y en Argentina cae el día
// anterior; las fechas ISO sin hora se arman como fecha local.
export const formatFecha = (value) => {
  if (!value) return '—'

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [anio, mes, dia] = value.split('-').map(Number)
    return fechaFormatter.format(new Date(anio, mes - 1, dia))
  }

  return fechaFormatter.format(new Date(value))
}
