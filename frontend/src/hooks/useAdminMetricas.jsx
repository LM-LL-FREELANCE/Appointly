import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getAdminMetricas } from '../api/adminMetricas.js'

export function useAdminMetricas(desde, hasta) {
  return useQuery({
    queryKey: ['admin', 'metricas', { desde: desde || '', hasta: hasta || '' }],
    queryFn: () => getAdminMetricas({ desde, hasta }),
    placeholderData: keepPreviousData,
  })
}
