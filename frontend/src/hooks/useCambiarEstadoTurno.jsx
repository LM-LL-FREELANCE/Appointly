import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconX } from '@tabler/icons-react'
import { cambiarEstadoTurno } from '../api/turnos.js'
import { estadoLabel } from '../utils/estadosTurno.js'
import { invalidarTurnosProfesional } from './useTurnosDia.jsx'

const TITULO_ERROR = {
  TOO_EARLY: 'Todavía no se puede',
  INVALID_TRANSITION: 'Cambio no permitido',
  STATE_CHANGED: 'El turno ya cambió',
  FORBIDDEN: 'Sin permiso',
}

// Professional moves a turno to en_curso / completado / ausente. Shows the backend's
// Spanish message on error and refreshes the lists either way (a 409 means we were stale).
export default function useCambiarEstadoTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cambiarEstadoTurno,
    meta: { silent: true }, // notified here, not by the global handler
    onSuccess: (turno, { estado }) => {
      notifications.show({
        id: 'turno-estado',
        title: 'Turno actualizado',
        message: `El turno quedó "${estadoLabel(estado)}".`,
        position: 'top-right',
        icon: <IconCheck size={16} />,
        color: 'green',
        autoClose: 3000,
      })
    },
    onError: (err) => {
      notifications.show({
        id: 'turno-estado-error',
        title: TITULO_ERROR[err?.code] ?? 'No se pudo actualizar el turno',
        message: err?.message || 'Ocurrió un error inesperado.',
        position: 'top-right',
        icon: <IconX size={16} />,
        color: 'red',
        autoClose: 5000,
      })
    },
    onSettled: (_data, _err, { id }) => invalidarTurnosProfesional(queryClient, id),
  })
}
