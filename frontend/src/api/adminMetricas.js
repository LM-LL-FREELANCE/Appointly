import { request } from './api.js'

export const getAdminMetricas = ({ desde, hasta } = {}) => {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  const qs = params.toString()
  return request(qs ? `/api/admin/metricas?${qs}` : '/api/admin/metricas')
}
