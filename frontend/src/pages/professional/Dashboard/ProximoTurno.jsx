import { useState } from 'react'
import { Group, Text, Stack, Avatar, Paper, Button, Badge, Divider } from "@mantine/core"
import { useDisclosure } from '@mantine/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconCalendarClock, IconCalendarOff, IconClock, IconCalendar, IconLogs, IconCancel } from '@tabler/icons-react'
import { TurnoProDetailModal } from './TurnoProDetailModal.jsx'
import { CancelarTurnoProfesionalModal } from './CancelarTurnoProfesionalModal.jsx'
import { cancelTurnoById } from '../../../api/clientes.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { aISO, fechaCorta, horaCorta } from '../../../utils/fechas.utils.js'

function labelRelativo(fechaISO) {
  const fecha = fechaISO?.slice(0, 10)
  if (!fecha) return null

  const hoy = aISO(new Date())
  const manana = aISO(new Date(Date.now() + 24 * 60 * 60 * 1000))

  if (fecha === hoy) return 'Hoy'
  if (fecha === manana) return 'Mañana'
  return fechaCorta(fechaISO)
}

export function ProximoTurno({ turno, isDesktop }) {
  const { user } = useAuth()

  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false)
  const [cancelOpened, { open: openCancel, close: closeCancel }] = useDisclosure(false)
  const [cancelFromDetail, setCancelFromDetail] = useState(false)

  const queryClient = useQueryClient()

  const { mutate: cancelTurno, isPending: isCancelling } = useMutation({
    mutationFn: (id) => cancelTurnoById(id, user?.dni),
    meta: { silent: true },
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

  const turnoParaCancelar = turno ? {
    fecha_turno: turno.fecha_turno?.slice(0, 10),
    hora_turno: turno.hora_turno?.slice(0, 5),
    p_nombre: turno.nombre,
    p_apellido: turno.apellido,
  } : null

  const relativo = turno ? labelRelativo(turno.fecha_turno) : null

  return (
    <Paper withBorder radius="lg" p="lg" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
      <Stack style={{ flex: 1 }} justify={turno ? 'flex-start' : 'space-between'} gap="lg">
        <Group gap="xs">
          <IconCalendarClock size={16} stroke={2} />
          <Text fw={700} fz="lg">Próximo turno</Text>
        </Group>
        <Divider />

        {turno ? (
          <>
            <Group gap="md" wrap="wrap">
              <Avatar size="xl" name={`${turno.apellido}, ${turno.nombre}`} color='initials' />
              <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} wrap="wrap">
                  <Text fw={700} fz="md">{turno.nombre} {turno.apellido}</Text>
                  {relativo && (
                    <Badge
                      variant="dot"
                      color={relativo === 'Hoy' ? 'brand' : 'gray'}
                      size="sm"
                      radius="xl"
                    >
                      {relativo}
                    </Badge>
                  )}
                </Group>
                <Group gap="md">
                  <Group gap={4}>
                    <IconClock size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                    <Text c="dimmed" fz="sm">{horaCorta(turno.hora_turno)} hs</Text>
                  </Group>
                  <Group gap={4}>
                    <IconCalendar size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                    <Text c="dimmed" fz="sm">{fechaCorta(turno.fecha_turno)}</Text>
                  </Group>
                </Group>
              </Stack>
            </Group>

            {isDesktop ? (
              <Stack gap="sm">
                <Divider size="xs" />
                <Button variant="default" radius="md" fullWidth leftSection={<IconLogs size={16} />} onClick={openDetail}>
                  Ver Detalle
                </Button>
                <Button variant="light" color="red" radius="md" fullWidth leftSection={<IconCancel size={16} />} onClick={() => { setCancelFromDetail(false); openCancel() }}>
                  Cancelar
                </Button>
              </Stack>
            ) : (
              <Group grow gap="sm">
                <Button variant="default" radius="md" leftSection={<IconLogs size={16} />} onClick={openDetail}>
                  Ver Detalle
                </Button>
                <Button variant="light" color="red" radius="md" leftSection={<IconCancel size={16} />} onClick={() => { setCancelFromDetail(false); openCancel() }}>
                  Cancelar
                </Button>
              </Group>
            )}

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
          <Stack align="center" justify="center" gap="xs" style={{ flex: 1 }}>
            <IconCalendarOff size={48} />
            <Text c="dimmed" fz="sm" ta="center">No hay turnos próximos</Text>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
