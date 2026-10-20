import { Box, Button, Divider, Group, Modal, Stack, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { IconHistory, IconCalendarEvent, IconX } from '@tabler/icons-react'
import { getTurnoById } from '../../../api/clientes.js'
import QueryError from '../../../components/QueryError.jsx'
import { EstadoTurnoBadge } from '../../../components/EstadoTurnoBadge.jsx'
import { esCancelable, esReprogramable } from '../../../utils/estadosTurno.js'

export function TurnoProDetailModal({
  opened,
  onClose,
  onCancelRequest,
  onReprogramar,
  onAbrirHistorial,
  turno,
}) {
  const { data: detail, isError, error, refetch } = useQuery({
    queryKey: ['turno', turno?.id_turno],
    queryFn: () => getTurnoById(turno?.id_turno),
    enabled: opened && !!turno?.id_turno,
  })

  const reservadoEl = detail?.creado_en
    ? new Date(detail.creado_en).toLocaleString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).replace(',', ' ·')
    : null

  const pacienteNombre = detail
    ? `${detail.c_nombre} ${detail.c_apellido}`.trim()
    : `${turno?.nombre ?? ''} ${turno?.apellido ?? ''}`.trim()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="sm"
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Box px="md" pt="md" pb="xs">
        <Group justify="space-between" align="center" mb="xs">
          <Text fw={700} fz="md">Detalle del turno</Text>
          {turno?.estado && (
            <EstadoTurnoBadge estado={turno.estado} size="sm" />
          )}
        </Group>
        <Divider mb="sm" />

        {isError ? (
          <QueryError message={error?.message || 'No se pudo cargar el detalle del turno'} onRetry={refetch} />
        ) : (
          <Stack gap="xs">
            <Group justify="space-between" align="baseline" py={2}>
              <Text fz="sm" c="dimmed">Paciente</Text>
              <Text fz="sm" fw={600} ta="right">{pacienteNombre || '—'}</Text>
            </Group>

            {detail?.tipo && (
              <Group justify="space-between" align="baseline" py={2}>
                <Text fz="sm" c="dimmed">Especialidad</Text>
                <Text fz="sm" fw={500} ta="right">{detail.tipo}</Text>
              </Group>
            )}

            <Group justify="space-between" align="baseline" py={2}>
              <Text fz="sm" c="dimmed">Fecha</Text>
              <Text fz="sm" fw={500} ta="right">{turno?.fecha_turno?.slice(0, 10)}</Text>
            </Group>

            <Group justify="space-between" align="baseline" py={2}>
              <Text fz="sm" c="dimmed">Hora</Text>
              <Text fz="sm" fw={500} ta="right">{turno?.hora_turno?.slice(0, 5)} hs</Text>
            </Group>

            {reservadoEl && (
              <Group justify="space-between" align="baseline" py={2}>
                <Text fz="sm" c="dimmed">Reservado el</Text>
                <Text fz="xs" c="dimmed" ta="right">{reservadoEl}</Text>
              </Group>
            )}
          </Stack>
        )}
      </Box>

      <Divider mt="xs" />

      <Box px="md" py="sm">
        <Group justify="space-between" gap="xs" wrap="wrap">
          {onAbrirHistorial ? (
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconHistory size={14} />}
              onClick={() => {
                onClose()
                onAbrirHistorial(turno)
              }}
            >
              Historial
            </Button>
          ) : <div />}

          <Group gap="xs" ml="auto">
            {esReprogramable(turno?.estado) && onReprogramar && (
              <Button
                variant="light"
                size="xs"
                leftSection={<IconCalendarEvent size={14} />}
                onClick={() => {
                  onClose()
                  onReprogramar(turno)
                }}
              >
                Reprogramar
              </Button>
            )}
            {esCancelable(turno?.estado) && onCancelRequest && (
              <Button
                variant="subtle"
                color="red"
                size="xs"
                leftSection={<IconX size={14} />}
                onClick={onCancelRequest}
              >
                Cancelar
              </Button>
            )}
            <Button variant="default" size="xs" onClick={onClose}>
              Cerrar
            </Button>
          </Group>
        </Group>
      </Box>
    </Modal>
  )
}
