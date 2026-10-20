import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cambiarEstadoCatalogoItem, crearCatalogoItem, editarCatalogoItem,
  getCatalogo, getProfesionalesCatalogo,
} from '../api/adminCatalogos.js'

const CATALOGOS_KEY = ['admin', 'catalogos']

export const useCatalogo = (recurso) => useQuery({
  queryKey: [...CATALOGOS_KEY, recurso],
  queryFn: () => getCatalogo(recurso),
})

export const useProfesionalesCatalogo = ({ recurso, id }) => useQuery({
  queryKey: [...CATALOGOS_KEY, recurso, 'profesionales', id],
  queryFn: () => getProfesionalesCatalogo({ recurso, id }),
  enabled: Boolean(id),
})

// Las mutaciones avisan en la pantalla que las dispara (meta.silent apaga el
// handler global) e invalidan la lista y el drawer del recurso.
const invalidarRecurso = (queryClient, recurso) =>
  queryClient.invalidateQueries({ queryKey: [...CATALOGOS_KEY, recurso] })

export function useCrearCatalogoItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearCatalogoItem,
    meta: { silent: true },
    onSuccess: (_data, variables) => invalidarRecurso(queryClient, variables.recurso),
  })
}

export function useEditarCatalogoItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: editarCatalogoItem,
    meta: { silent: true },
    onSuccess: (_data, variables) => invalidarRecurso(queryClient, variables.recurso),
  })
}

export function useCambiarEstadoCatalogoItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cambiarEstadoCatalogoItem,
    meta: { silent: true },
    onSuccess: (_data, variables) => invalidarRecurso(queryClient, variables.recurso),
  })
}
