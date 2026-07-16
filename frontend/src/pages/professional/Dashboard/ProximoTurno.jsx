import { useState } from 'react'
import { Group, Text, Stack, Avatar, Paper, Button } from "@mantine/core"
import { useDisclosure } from '@mantine/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TurnoProDetailModal } from './TurnoProDetailModal.jsx'
import { CancelarTurnoProfesionalModal } from './CancelarTurnoProfesionalModal.jsx'
import { cancelTurnoById } from '../../../services/clientes.js'
import { useAuth } from '../../../hooks/useAuth.js'

/* const CURRENT_DNI = '27845123' */

export function ProximoTurno({ turno }) {
  const { user } = useAuth()

  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false)
  const [cancelOpened, { open: openCancel, close: closeCancel }] = useDisclosure(false)
  const [cancelFromDetail, setCancelFromDetail] = useState(false)

  const queryClient = useQueryClient()

  const { mutate: cancelTurno, isPending: isCancelling } = useMutation({
    mutationFn: (id) => cancelTurnoById(id, user?.dni),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos-profesional', user?.dni] })
      closeCancel()
      setCancelFromDetail(false)
    },
    onError: (err) => {
      if (err.status === 409 && err.code === 'ALREADY_CANCELLED') {
        queryClient.invalidateQueries({ queryKey: ['turnos-profesional', user?.dni] })
        closeCancel()
        setCancelFromDetail(false)
      }
    },
  })

  const handleCancelRequestFromDetail = () => {
    closeDetail()
    setCancelFromDetail(true)
    openCancel()
  }

  const handleCloseCancel = () => {
    if (isCancelling) return
    closeCancel()
    if (cancelFromDetail) {
      setCancelFromDetail(false)
      openDetail()
    }
  }

  // CancelarTurnoModal expects p_nombre/p_apellido — remap to show the patient's name
  const turnoParaCancelar = turno ? {
    fecha_turno: turno.fecha_turno?.slice(0, 10),
    hora_turno: turno.hora_turno?.slice(0, 5),
    p_nombre: turno.nombre,
    p_apellido: turno.apellido,
  } : null

  return (
    <Paper withBorder radius="lg" p="lg" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
      <Stack style={{ flex: 1 }} justify="space-between">
        <Text fw={700} fz="lg">Próximo turno</Text>

        {turno ? (
          <>
            <Group gap="lg">
              <Avatar radius="xl" size="xl" />
              <Stack gap={4}>
                <Text fw={700} fz="md">{turno.apellido}, {turno.nombre}</Text>
                <Text c="dimmed" fz="sm">{turno.hora_turno?.slice(0, 5)}</Text>
              </Stack>
            </Group>
            <Group grow gap="md">
              <Button variant="default" radius="md" onClick={openDetail}>Detalle</Button>
              <Button variant="light" color="red" radius="md" onClick={() => { setCancelFromDetail(false); openCancel() }}>
                Cancelar
              </Button>
            </Group>

            <TurnoProDetailModal
              opened={detailOpened}
              onClose={closeDetail}
              onCancelRequest={handleCancelRequestFromDetail}
              turno={turno}
              dni={user?.dni}
            />
            <CancelarTurnoProfesionalModal
              opened={cancelOpened}
              onClose={handleCloseCancel}
              onConfirm={(_motivo) => cancelTurno(turno.id_turno)}
              turno={turnoParaCancelar}
              isPending={isCancelling}
            />
          </>
        ) : (
          <Text c="dimmed" fz="sm" ta="center" py="xl">No hay más turnos próximos</Text>
        )}
      </Stack>
    </Paper>
  )
}
