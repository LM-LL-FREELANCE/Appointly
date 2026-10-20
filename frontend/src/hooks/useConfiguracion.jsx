import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actualizarConfiguracion, getConfiguracion } from '../api/configuracion.js'

export const CONFIGURACION_KEY = ['configuracion']

export const useConfiguracion = () => useQuery({
  queryKey: CONFIGURACION_KEY,
  queryFn: getConfiguracion,
  staleTime: 5 * 60 * 1000,
})

export function useActualizarConfiguracion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: actualizarConfiguracion,
    meta: { silent: true },
    onSuccess: (data) => {
      queryClient.setQueryData(CONFIGURACION_KEY, data)
    },
  })
}
