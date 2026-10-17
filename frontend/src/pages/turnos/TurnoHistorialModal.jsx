import { Box, Button, Divider, Group, Loader, Modal, Text, Timeline } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { IconArrowRight } from '@tabler/icons-react'
import { getEventosTurno } from '../../api/turnos.js'
import QueryError from '../../components/QueryError.jsx'
import { ESTADO_COLOR, describirEvento } from '../../utils/estadosTurno.js'
import { EstadoTurnoBadge } from '../../components/EstadoTurnoBadge.jsx'
import { formatearFechaHoraEvento } from '../../utils/fechas.utils.js'

const TITULO_EVENTO = {
  en_curso: 'Atención iniciada',
  completado: 'Consulta finalizada',
  ausente: 'Marcado como ausente',
  reprogramado: 'Turno reprogramado',
  cancelado: 'Turno cancelado',
  confirmado: 'Turno confirmado',
  en_espera: 'En sala de espera',
  pendiente_confirmacion: 'Pendiente de confirmación',
}

// "Historial" of a turno: who changed its state, when, and why (turno_evento).
export function TurnoHistorialModal({ opened, onClose, turnoId, idTurno }) {
  const resolvedId = turnoId ?? idTurno
  const isOpened = opened !== undefined ? Boolean(opened) : Boolean(resolvedId)

  const { data: eventos, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['turno-eventos', resolvedId],
    queryFn: () => getEventosTurno(resolvedId),
    enabled: isOpened && !!resolvedId,
  })

  return (
    <Modal
      opened={isOpened}
      onClose={onClose}
      centered
      size="sm"
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Box px="md" pt="md" pb="xs" mih={140}>
        <Text fw={700} fz="md" mb="xs">Historial del turno</Text>
        <Divider mb="sm" />

        {isLoading && (
          <Group justify="center" py="xl"><Loader size="sm" /></Group>
        )}

        {isError && (
          <QueryError message={error?.message} onRetry={refetch} title="No pudimos cargar el historial" />
        )}

        {!isLoading && !isError && eventos?.length === 0 && (
          <Text c="dimmed" fz="sm" ta="center" py="xl">Este turno todavía no tiene movimientos registrados.</Text>
        )}

        {!isLoading && !isError && eventos?.length > 0 && (
          <Timeline active={eventos.length - 1} bulletSize={14} lineWidth={2}>
            {eventos.map((evento) => {
              const { actor, motivo, estadoNuevo } = describirEvento(evento)
              const tituloAccion = evento.estado_anterior
                ? (TITULO_EVENTO[evento.estado_nuevo] ?? 'Cambio de estado')
                : 'Turno creado'

              return (
                <Timeline.Item
                  key={evento.id_evento}
                  title={<Text fw={600} fz="sm">{tituloAccion}</Text>}
                  color={ESTADO_COLOR[estadoNuevo] ?? 'gray'}
                >
                  {evento.estado_anterior ? (
                    <Group gap={6} align="center" mt={3} mb={4} wrap="nowrap">
                      <EstadoTurnoBadge estado={evento.estado_anterior} size="xs" />
                      <IconArrowRight size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
                      <EstadoTurnoBadge estado={evento.estado_nuevo} size="xs" />
                    </Group>
                  ) : (
                    <Group gap={6} align="center" mt={3} mb={4}>
                      <EstadoTurnoBadge estado={evento.estado_nuevo} size="xs" />
                    </Group>
                  )}

                  <Text fz="xs" c="dimmed">Por {actor}</Text>
                  {motivo && (
                    <Text fz="xs" c="dimmed" mt={2} fs="italic">
                      Motivo: {motivo}
                    </Text>
                  )}
                  <Text fz="xs" c="dimmed" mt={2}>
                    {formatearFechaHoraEvento(evento.creado_en)}
                  </Text>
                </Timeline.Item>
              )
            })}
          </Timeline>
        )}
      </Box>

      <Divider mt="xs" />

      <Box px="md" py="sm">
        <Group justify="flex-end">
          <Button variant="default" size="xs" onClick={onClose}>Cerrar</Button>
        </Group>
      </Box>
    </Modal>
  )
}
