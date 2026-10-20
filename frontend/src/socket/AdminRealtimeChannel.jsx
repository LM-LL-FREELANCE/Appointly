import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import {
  IconArrowsExchange, IconBellRinging, IconCalendarPlus, IconCalendarX, IconSpeakerphone,
} from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth.js'
import { disconnectSocket, getSocket } from './client.js'
import { fechaCorta, horaCorta } from '../utils/fechas.utils.js'

const EVENTOS_CONOCIDOS = new Set([
  'turno:creado', 'turno:cancelado', 'turno:reasignado', 'aviso:publicado',
])

const nombreDe = (persona) => {
  if (!persona) return ''
  if (typeof persona === 'string') return persona

  const nombre = persona.nombre_completo ?? persona.nombreCompleto
  if (nombre) return String(nombre)

  return [persona.nombre, persona.apellido].filter(Boolean).join(' ').trim()
}

const cuandoDe = (payload) => {
  if (!payload?.fecha_turno) return ''

  const fecha = new Date(payload.fecha_turno)
  if (Number.isNaN(fecha.getTime())) return ''

  return [
    fechaCorta(payload.fecha_turno),
    payload.hora_turno ? horaCorta(payload.hora_turno) : '',
  ].filter(Boolean).join(' ')
}

const idDe = (tipo, payload) => (
  payload?.id_turno != null
    ? `admin-${tipo}-turno-${payload.id_turno}`
    : `admin-${tipo}-${Date.now()}`
)

// ————————————————————————————————————————————————————————————————
// Canal realtime del panel (PLAN_ADMIN.md §9 / DISENO §13).
// Solo escucha: cada evento muestra una notificación e invalida las queries
// que correspondan. El servidor nunca manda datos sensibles por acá.
// ————————————————————————————————————————————————————————————————
export function AdminRealtimeChannel() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (user?.role !== 'admin') {
      disconnectSocket()
      return undefined
    }

    const socket = getSocket()

    const invalidarTurnos = () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'turnos'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'metricas'] })
    }

    const handleTurnoCreado = (payload = {}) => {
      const paciente = nombreDe(payload.cliente ?? payload.paciente) || 'Un cliente'
      const profesional = nombreDe(payload.profesional)
      const cuando = cuandoDe(payload)
      const detalle = [
        paciente,
        profesional ? `reservó con ${profesional}` : 'reservó un turno',
        cuando ? `para el ${cuando}` : '',
      ].filter(Boolean).join(' ')

      notifications.show({
        id: idDe('turno-creado', payload),
        color: 'blue',
        icon: <IconCalendarPlus size={18} />,
        title: 'Nuevo turno',
        message: `${detalle}.`,
        position: 'top-right',
        autoClose: 6000,
      })
      invalidarTurnos()
    }

    const handleTurnoCancelado = (payload = {}) => {
      const paciente = nombreDe(payload.cliente ?? payload.paciente)
      const profesional = nombreDe(payload.profesional)
      const cuando = cuandoDe(payload)
      const base = [paciente, cuando].filter(Boolean).join(' · ')
      const detalle = [base, profesional ? `con ${profesional}` : ''].filter(Boolean).join(' ')

      notifications.show({
        id: idDe('turno-cancelado', payload),
        color: 'red',
        icon: <IconCalendarX size={18} />,
        title: 'Turno cancelado',
        message: detalle ? `${detalle}.` : 'Un turno fue cancelado.',
        position: 'top-right',
        autoClose: 6000,
      })
      invalidarTurnos()
    }

    const handleTurnoReasignado = (payload = {}) => {
      const paciente = nombreDe(payload.cliente ?? payload.paciente) || 'El turno'
      const profesionalNuevo = nombreDe(
        payload.profesional_nuevo ?? payload.profesionalNuevo ?? payload.profesional,
      )
      const cuando = cuandoDe(payload)
      const detalle = [
        `${paciente} pasa a ${profesionalNuevo || 'otro profesional'}`,
        cuando,
      ].filter(Boolean).join(' · ')

      notifications.show({
        id: idDe('turno-reasignado', payload),
        color: 'yellow',
        icon: <IconArrowsExchange size={18} />,
        title: 'Turno reasignado',
        message: `${detalle}.`,
        position: 'top-right',
        autoClose: 6000,
      })
      queryClient.invalidateQueries({ queryKey: ['admin', 'turnos'] })
    }

    const handleAvisoPublicado = (payload = {}) => {
      notifications.show({
        id: payload?.id_aviso != null ? `admin-aviso-${payload.id_aviso}` : `admin-aviso-${Date.now()}`,
        color: 'cyan',
        icon: <IconSpeakerphone size={18} />,
        title: 'Nuevo aviso publicado',
        message: payload?.titulo ?? 'Hay un aviso nuevo para el centro.',
        position: 'top-right',
        autoClose: 6000,
      })
      queryClient.invalidateQueries({ queryKey: ['avisos', 'activos'] })
    }

    const handleEventoDesconocido = (evento, payload = {}) => {
      if (EVENTOS_CONOCIDOS.has(evento)) return

      notifications.show({
        id: `admin-evento-${evento}-${payload?.id_turno ?? payload?.id_aviso ?? Date.now()}`,
        color: 'gray',
        icon: <IconBellRinging size={18} />,
        title: 'Actualización del panel',
        message: payload?.mensaje ?? payload?.titulo ?? 'Hay novedades en el centro.',
        position: 'top-right',
        autoClose: 5000,
      })
    }

    socket.on('turno:creado', handleTurnoCreado)
    socket.on('turno:cancelado', handleTurnoCancelado)
    socket.on('turno:reasignado', handleTurnoReasignado)
    socket.on('aviso:publicado', handleAvisoPublicado)
    socket.onAny(handleEventoDesconocido)

    return () => {
      socket.off('turno:creado', handleTurnoCreado)
      socket.off('turno:cancelado', handleTurnoCancelado)
      socket.off('turno:reasignado', handleTurnoReasignado)
      socket.off('aviso:publicado', handleAvisoPublicado)
      socket.offAny(handleEventoDesconocido)
    }
  }, [user?.role, queryClient])

  return null
}
