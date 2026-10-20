import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getHistorialComunicaciones,
  getPreviewSegmento,
  enviarComunicadoIndividual,
  enviarComunicadoMasivo,
} from '../api/adminComunicaciones.js'

export function useHistorialComunicaciones() {
  return useQuery({
    queryKey: ['admin', 'comunicaciones'],
    queryFn: getHistorialComunicaciones,
  })
}

export function usePreviewSegmento({ tipo, desde, hasta, enabled = true }) {
  const listo =
    Boolean(tipo) &&
    enabled &&
    (tipo !== 'clientes_turnos_activos' || (Boolean(desde) && Boolean(hasta) && desde <= hasta))

  return useQuery({
    queryKey: [
      'admin',
      'comunicaciones',
      'segmento',
      { tipo: tipo || '', desde: desde || '', hasta: hasta || '' },
    ],
    queryFn: () => getPreviewSegmento({ tipo, desde, hasta }),
    enabled: listo,
  })
}

export function useEnviarIndividual() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: enviarComunicadoIndividual,
    meta: { silent: true },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comunicaciones'] })
    },
  })
}

export function useEnviarMasivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: enviarComunicadoMasivo,
    meta: { silent: true },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comunicaciones'] })
    },
  })
}
