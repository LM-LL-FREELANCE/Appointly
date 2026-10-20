// Presentación compartida de avisos (DISENO_ADMIN.md §2.6 y §8.1).
// El color nunca va solo: siempre acompaña a un ícono y texto.

import { formatFecha } from './fechas.admin.js'

export const AVISOS_TIPOS = {
  info: { label: 'Info', color: 'brand' },
  advertencia: { label: 'Advertencia', color: 'yellow' },
  critico: { label: 'Crítico', color: 'red' },
}

export const AVISOS_ORDEN = ['critico', 'advertencia', 'info']

export const avisoTipo = (tipo) => AVISOS_TIPOS[tipo] ?? AVISOS_TIPOS.info

export const vigenciaAviso = ({ vigente_desde: desde, vigente_hasta: hasta }) => {
  if (desde && hasta) return `Programado: ${formatFecha(desde)} — ${formatFecha(hasta)}`
  if (desde) return `Desde el ${formatFecha(desde)}`
  if (hasta) return `Vigente hasta el ${formatFecha(hasta)}`
  return 'Sin fecha límite'
}
