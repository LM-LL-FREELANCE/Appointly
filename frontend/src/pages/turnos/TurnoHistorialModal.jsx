import { Box, Button, Group, Loader, Modal, Text, Timeline } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { getEventosTurno } from '../../api/turnos.js'
import QueryError from '../../components/QueryError.jsx'
import { ESTADO_COLOR, describirEvento } from '../../utils/estadosTurno.js'
import { formatearFechaHoraEvento } from '../../utils/fechas.utils.js'

// "Historial" of a turno: who changed its state, when, and why (turno_evento).
export function TurnoHistorialModal({ opened, onClose, turnoId }) {
  const { data: eventos, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['turno-eventos', turnoId],
    queryFn: () => getEventosTurno(turnoId),
    enabled: opened && !!turnoId,
  })

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="md"
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Box px="lg" pt="lg" pb="md" mih={160}>
        <Text fw={700} fz="lg" mb="lg">Historial del turno</Text>

        {isLoading && (
          <Group justify="center" py="xl"><Loader /></Group>
        )}

        {isError && (
          <QueryError message={error?.message} onRetry={refetch} title="No pudimos cargar el historial" />
        )}

        {!isLoading && !isError && eventos?.length === 0 && (
          <Text c="dimmed" fz="sm" ta="center" py="xl">Este turno todavía no tiene movimientos registrados.</Text>
        )}

        {!isLoading && !isError && eventos?.length > 0 && (
          <Timeline active={eventos.length - 1} bulletSize={16} lineWidth={2}>
            {eventos.map((evento) => {
              const { titulo, actor, motivo, estadoNuevo } = describirEvento(evento)
              return (
                <Timeline.Item key={evento.id_evento} title={titulo} color={ESTADO_COLOR[estadoNuevo] ?? 'gray'}>
                  <Text fz="sm" c="dimmed">{actor}</Text>
                  {motivo && <Text fz="sm" mt={2}>Motivo: {motivo}</Text>}
                  <Text fz="xs" c="dimmed" mt={4}>{formatearFechaHoraEvento(evento.creado_en)}</Text>
                </Timeline.Item>
              )
            })}
          </Timeline>
        )}
      </Box>

      <Box px="lg" py="md">
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cerrar</Button>
        </Group>
      </Box>
    </Modal>
  )
}
