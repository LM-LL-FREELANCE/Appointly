import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconX } from '@tabler/icons-react'
import { reprogramarTurno } from '../api/turnos.js'
import { fechaCorta, horaCorta } from '../utils/fechas.utils.js'
import { invalidarTurnosProfesional } from './useTurnosDia.jsx'

const TITULO_ERROR = {
  SLOT_TAKEN: 'Horario ocupado',
  OUT_OF_SCHEDULE: 'Fuera de la agenda',
  NOT_REPROGRAMMABLE: 'No se puede reprogramar',
  ALREADY_REPROGRAMMED: 'Ya fue reprogramado',
  VALIDATION_FAILED: 'Datos inválidos',
  FORBIDDEN: 'Sin permiso',
}

// Reprograms a turno (professional now, admin later: nothing here depends on the role).
// Shows the backend's Spanish message on error and refreshes the lists and the free-slot
// pickers either way (a SLOT_TAKEN means the picker was stale).
export default function useReprogramarTurno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reprogramarTurno,
    meta: { silent: true }, // notified here, not by the global handler
    onSuccess: ({ nuevo }) => {
      notifications.show({
        id: 'turno-reprogramado',
        title: 'Turno reprogramado',
        message: `Nuevo horario: ${fechaCorta(nuevo.fecha_turno)} · ${horaCorta(nuevo.hora_turno)} hs. Se avisó al paciente por email.`,
        position: 'top-right',
        icon: <IconCheck size={16} />,
        color: 'green',
        autoClose: 4000,
      })
    },
    onError: (err) => {
      notifications.show({
        id: 'turno-reprogramado-error',
        title: TITULO_ERROR[err?.code] ?? 'No se pudo reprogramar el turno',
        message: err?.message || 'Ocurrió un error inesperado.',
        position: 'top-right',
        icon: <IconX size={16} />,
        color: 'red',
        autoClose: 5000,
      })
    },
    onSettled: (_data, _err, { id }) => {
      invalidarTurnosProfesional(queryClient, id)
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}
