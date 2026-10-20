import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconX } from '@tabler/icons-react'
import {
  getAdminTurnos,
  cancelarTurnoAdmin,
  reasignarTurno,
  completarTurnoAdmin,
  ausenteTurnoAdmin,
  getBloqueos,
  crearBloqueo,
  eliminarBloqueo,
} from '../api/adminTurnos.js'
import { getFilteredProfesional } from '../api/profesionales.js'
import { invalidarTurnosProfesional } from './useTurnosDia.jsx'

export function useAdminTurnos({ desde, hasta, estado, profesional, cliente } = {}) {
  return useQuery({
    queryKey: [
      'admin',
      'turnos',
      {
        desde: desde || '',
        hasta: hasta || '',
        estado: estado || '',
        profesional: profesional || '',
        cliente: cliente || '',
      },
    ],
    queryFn: () => getAdminTurnos({ desde, hasta, estado, profesional, cliente }),
  })
}

export function useProfesionalesList() {
  return useQuery({
    queryKey: ['profesionales', 'all'],
    queryFn: () => getFilteredProfesional({}),
    staleTime: 60_000,
  })
}

export function useCancelarTurnoAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelarTurnoAdmin,
    meta: { silent: true },
    onSuccess: (_data, { id }) => {
      invalidarTurnosProfesional(queryClient, id)
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      notifications.show({
        title: 'Turno cancelado',
        message: 'Se avisó por email al cliente y al profesional.',
        position: 'top-right',
        icon: <IconCheck size={16} />,
        color: 'green',
        autoClose: 3500,
      })
    },
    onError: (err) => {
      notifications.show({
        title: 'No se pudo cancelar el turno',
        message: err?.message || 'Ocurrió un error al cancelar el turno.',
        position: 'top-right',
        icon: <IconX size={16} />,
        color: 'red',
        autoClose: 5000,
      })
    },
  })
}

export function useReasignarTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reasignarTurno,
    meta: { silent: true },
    onSuccess: (_data, { id }) => {
      invalidarTurnosProfesional(queryClient, id)
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      notifications.show({
        title: 'Turno reasignado',
        message: 'Turno reasignado. Se avisó al cliente y al profesional nuevo.',
        position: 'top-right',
        icon: <IconCheck size={16} />,
        color: 'green',
        autoClose: 3500,
      })
    },
  })
}

export function useCompletarTurnoAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: completarTurnoAdmin,
    meta: { silent: true },
    onSuccess: (_data, { id }) => {
      invalidarTurnosProfesional(queryClient, id)
      notifications.show({
        title: 'Turno actualizado',
        message: 'Turno marcado como completado.',
        position: 'top-right',
        icon: <IconCheck size={16} />,
        color: 'green',
        autoClose: 3000,
      })
    },
    onError: (err) => {
      notifications.show({
        title: 'No se pudo actualizar el turno',
        message: err?.message || 'Ocurrió un error inesperado.',
        position: 'top-right',
        icon: <IconX size={16} />,
        color: 'red',
        autoClose: 5000,
      })
    },
  })
}

export function useAusenteTurnoAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ausenteTurnoAdmin,
    meta: { silent: true },
    onSuccess: (_data, { id }) => {
      invalidarTurnosProfesional(queryClient, id)
      notifications.show({
        title: 'Turno actualizado',
        message: 'Turno marcado como ausente.',
        position: 'top-right',
        icon: <IconCheck size={16} />,
        color: 'green',
        autoClose: 3000,
      })
    },
    onError: (err) => {
      notifications.show({
        title: 'No se pudo actualizar el turno',
        message: err?.message || 'Ocurrió un error inesperado.',
        position: 'top-right',
        icon: <IconX size={16} />,
        color: 'red',
        autoClose: 5000,
      })
    },
  })
}

export function useBloqueos({ desde, hasta, profesional, enabled = true } = {}) {
  return useQuery({
    queryKey: [
      'admin',
      'bloqueos',
      {
        desde: desde || '',
        hasta: hasta || '',
        profesional: profesional || '',
      },
    ],
    queryFn: () => getBloqueos({ desde, hasta, profesional }),
    enabled,
  })
}

export function useCrearBloqueo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: crearBloqueo,
    meta: { silent: true },
    onSuccess: (creados) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bloqueos'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      const cant = Array.isArray(creados) ? creados.length : 1
      notifications.show({
        title: cant > 1 ? 'Bloqueos creados' : 'Bloqueo creado',
        message: cant > 1 ? `Se crearon ${cant} bloqueos.` : 'Bloqueo creado.',
        position: 'top-right',
        icon: <IconCheck size={16} />,
        color: 'green',
        autoClose: 3500,
      })
    },
    onError: (err) => {
      notifications.show({
        title: 'No se pudo crear el bloqueo',
        message: err?.message || 'Ocurrió un error al crear el bloqueo.',
        position: 'top-right',
        icon: <IconX size={16} />,
        color: 'red',
        autoClose: 5000,
      })
    },
  })
}

export function useEliminarBloqueo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: eliminarBloqueo,
    meta: { silent: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bloqueos'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      notifications.show({
        title: 'Bloqueo eliminado',
        message: 'Bloqueo eliminado.',
        position: 'top-right',
        icon: <IconCheck size={16} />,
        color: 'green',
        autoClose: 3000,
      })
    },
    onError: (err) => {
      notifications.show({
        title: 'No se pudo eliminar el bloqueo',
        message: err?.message || 'Ocurrió un error al eliminar el bloqueo.',
        position: 'top-right',
        icon: <IconX size={16} />,
        color: 'red',
        autoClose: 5000,
      })
    },
  })
}
