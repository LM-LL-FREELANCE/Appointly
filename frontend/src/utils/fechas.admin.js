const formatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export const formatFechaHora = (value) => (value ? formatter.format(new Date(value)) : '-')
