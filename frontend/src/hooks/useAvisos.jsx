import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  crearAviso, editarAviso, eliminarAviso, getAvisosActivos, getAvisosAdmin,
} from '../api/avisos.js'

export const AVISOS_ACTIVOS_KEY = ['avisos', 'activos']
export const AVISOS_ADMIN_KEY = ['admin', 'avisos']

export const useAvisosActivos = () => useQuery({
  queryKey: AVISOS_ACTIVOS_KEY,
  queryFn: getAvisosActivos,
  staleTime: 5 * 60 * 1000,
})

export const useAvisosAdmin = () => useQuery({
  queryKey: AVISOS_ADMIN_KEY,
  queryFn: getAvisosAdmin,
})

const invalidarAvisos = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: AVISOS_ACTIVOS_KEY })
  queryClient.invalidateQueries({ queryKey: AVISOS_ADMIN_KEY })
}

export function useCrearAviso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearAviso,
    meta: { silent: true },
    onSuccess: () => invalidarAvisos(queryClient),
  })
}

export function useEditarAviso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: editarAviso,
    meta: { silent: true },
    onSuccess: () => invalidarAvisos(queryClient),
  })
}

export function useEliminarAviso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: eliminarAviso,
    meta: { silent: true },
    onSuccess: () => invalidarAvisos(queryClient),
  })
}
