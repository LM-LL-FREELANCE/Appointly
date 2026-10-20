import { request } from './api.js'

export const getHistorialComunicaciones = () => {
  return request('/api/admin/comunicaciones')
}

export const getPreviewSegmento = ({ tipo, desde, hasta }) => {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  const qs = params.toString()
  return request(
    qs
      ? `/api/admin/comunicaciones/segmentos/${encodeURIComponent(tipo)}?${qs}`
      : `/api/admin/comunicaciones/segmentos/${encodeURIComponent(tipo)}`,
  )
}

export const enviarComunicadoIndividual = ({ dni, rol, asunto, mensaje }) => {
  return request('/api/admin/comunicaciones/individual', {
    method: 'POST',
    body: JSON.stringify({ dni: Number(dni), rol, asunto, mensaje }),
  })
}

export const enviarComunicadoMasivo = ({ segmento, desde, hasta, asunto, mensaje }) => {
  const payload = { segmento, asunto, mensaje }
  if (segmento === 'clientes_turnos_activos') {
    if (desde) payload.desde = desde
    if (hasta) payload.hasta = hasta
  }
  return request('/api/admin/comunicaciones/masivo', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
