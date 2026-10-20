import { useState } from 'react'
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconAlertCircle, IconPlus, IconTrash } from '@tabler/icons-react'
import QueryError from '../../../components/QueryError.jsx'
import { fechaCorta, horaCorta } from '../../../utils/fechas.utils.js'
import { useBloqueos, useEliminarBloqueo } from '../../../hooks/useAdminTurnos.jsx'
import { NuevoBloqueoModal } from './NuevoBloqueoModal.jsx'

const COLUMNAS = ['Fecha(s)', 'Horario', 'Alcance', 'Motivo', 'Acciones']

function formatearRangoTexto(desde, hasta) {
  if (desde && hasta) return `${fechaCorta(desde)} — ${fechaCorta(hasta)}`
  if (desde) return `Desde ${fechaCorta(desde)}`
  if (hasta) return `Hasta ${fechaCorta(hasta)}`
  return 'Todo el período'
}

export function BloqueosModal({ opened, onClose, desde, hasta, profesionales = [] }) {
  const [nuevoAbierto, { open: abrirNuevo, close: cerrarNuevo }] = useDisclosure(false)
  const [aEliminar, setAEliminar] = useState(null)

  const { data: bloqueos = [], isLoading, isError, error, refetch } = useBloqueos({
    desde,
    hasta,
    enabled: opened,
  })
  const { mutate: eliminar, isPending: eliminando } = useEliminarBloqueo()

  const confirmarEliminacion = () => {
    if (!aEliminar) return
    eliminar(aEliminar.id_bloqueo, {
      onSuccess: () => setAEliminar(null),
    })
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Box>
            <Text fw={700} fz="lg">Bloqueos de agenda</Text>
            <Text fz="xs" c="dimmed">
              Solo de este rango: {formatearRangoTexto(desde, hasta)}
            </Text>
          </Box>
        }
        centered
        size="xl"
        overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
      >
        <Stack gap="md">
          {isLoading && (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          )}

          {isError && (
            <QueryError
              message={error?.message || 'No se pudieron cargar los bloqueos de agenda'}
              onRetry={refetch}
            />
          )}

          {!isLoading && !isError && bloqueos.length === 0 && (
            <Text c="dimmed" fz="sm" ta="center" py="xl">
              No hay bloqueos en este rango.
            </Text>
          )}

          {!isLoading && !isError && bloqueos.length > 0 && (
            <Table.ScrollContainer minWidth={640}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    {COLUMNAS.map((col) => (
                      <Table.Th key={col} style={col === 'Acciones' ? { width: 56 } : undefined}>
                        <Text fz="xs" fw={700} tt="uppercase" c="dimmed">{col}</Text>
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {bloqueos.map((b) => {
                    const horarioTexto = b.hora_inicio && b.hora_fin
                      ? `${horaCorta(b.hora_inicio)}–${horaCorta(b.hora_fin)}`
                      : 'Todo el día'
                    const alcanceTexto = b.dni_profesional
                      ? `${b.p_nombre ?? ''} ${b.p_apellido ?? ''}`.trim() || `DNI ${b.dni_profesional}`
                      : 'Todo el centro'

                    return (
                      <Table.Tr key={b.id_bloqueo}>
                        <Table.Td>
                          <Text fz="sm" fw={500}>{fechaCorta(b.fecha)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="sm">{horarioTexto}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="sm">{alcanceTexto}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="sm" c="dimmed" lineClamp={1}>
                            {b.motivo || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label="Eliminar bloqueo"
                            onClick={() => setAEliminar(b)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}

          <Divider />

          <Group justify="space-between" gap="sm">
            <Button variant="default" radius="md" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              radius="md"
              leftSection={<IconPlus size={16} />}
              onClick={abrirNuevo}
            >
              Nuevo bloqueo
            </Button>
          </Group>
        </Stack>
      </Modal>

      <NuevoBloqueoModal
        opened={nuevoAbierto}
        onClose={cerrarNuevo}
        profesionales={profesionales}
      />

      <Modal
        opened={Boolean(aEliminar)}
        onClose={() => !eliminando && setAEliminar(null)}
        centered
        size="sm"
        withCloseButton={false}
        styles={{ body: { padding: 0 } }}
        overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
      >
        <Box px="lg" pt="lg" pb="md">
          <Group gap="sm" mb="md" align="center" wrap="nowrap">
            <IconAlertCircle size={28} color="var(--mantine-color-red-6)" style={{ flexShrink: 0 }} />
            <Text fw={700} fz="xl">¿Eliminar este bloqueo?</Text>
          </Group>
          <Text c="dimmed" fz="sm" lh={1.6}>
            Los horarios vuelven a estar disponibles para reservar.
          </Text>
        </Box>
        <Box px="lg" py="md">
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              radius="md"
              onClick={() => setAEliminar(null)}
              disabled={eliminando}
            >
              No, volver
            </Button>
            <Button
              variant="light"
              color="red"
              radius="md"
              onClick={confirmarEliminacion}
              loading={eliminando}
            >
              Sí, eliminar
            </Button>
          </Group>
        </Box>
      </Modal>
    </>
  )
}
