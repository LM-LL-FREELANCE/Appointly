import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  darDeBajaUsuario, editarUsuario, getUsuario, getUsuarios, reactivarUsuario,
  resetPasswordUsuario, suspenderUsuario,
} from '../api/adminUsuarios.js'

const USUARIOS_KEY = ['admin', 'usuarios']

const usuarioKey = (dni, rol) => [...USUARIOS_KEY, String(dni), rol]

export const useUsuarios = (filtros) => useQuery({
  queryKey: [...USUARIOS_KEY, filtros],
  queryFn: () => getUsuarios(filtros),
})

export const useUsuario = ({ dni, rol }) => useQuery({
  queryKey: usuarioKey(dni, rol),
  queryFn: () => getUsuario({ dni, rol }),
  enabled: Boolean(dni && rol),
})

// Las mutaciones avisan en la pantalla que las dispara (meta.silent apaga el
// handler global) y siempre invalidan lista + ficha por prefijo de key.

export function useEditarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: editarUsuario,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USUARIOS_KEY }),
  })
}

export function useSuspenderUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: suspenderUsuario,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USUARIOS_KEY }),
  })
}

export function useReactivarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reactivarUsuario,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USUARIOS_KEY }),
  })
}

export function useDarDeBajaUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: darDeBajaUsuario,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USUARIOS_KEY }),
  })
}

export function useResetPasswordUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resetPasswordUsuario,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USUARIOS_KEY }),
  })
}
