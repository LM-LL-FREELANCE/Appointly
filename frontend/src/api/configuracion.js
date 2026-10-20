import { request } from './api.js'

// WS3 — configuración general del centro (PLAN_ADMIN.md §8.2 C1/C2).

export const getConfiguracion = () => request('/api/configuracion')

export const actualizarConfiguracion = (config) => request('/api/admin/configuracion', {
  method: 'PUT',
  body: JSON.stringify(config),
})
