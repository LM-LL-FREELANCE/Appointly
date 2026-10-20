import { useState } from 'react'
import { Badge, Center, Loader, Paper, Stack, Table, Text } from '@mantine/core'
import { IconHistory } from '@tabler/icons-react'
import QueryError from '../../../components/QueryError.jsx'
import { useHistorialComunicaciones } from '../../../hooks/useAdminComunicaciones.jsx'
import { formatearFechaHoraEvento } from '../../../utils/fechas.utils.js'
import { EnvioDetalleDrawer } from './EnvioDetalleDrawer.jsx'

const COLUMNAS = ['Fecha', 'Tipo', 'Destino', 'Asunto', 'Envíos', 'Éxitos', 'Fallos']

const ETIQUETA_SEGMENTO = {
  todos: 'Todos los usuarios',
  profesionales: 'Profesionales',
  clientes_turnos_activos: 'Clientes con turnos en un período',
}

function describirDestino(item) {
  if (item.tipo === 'masivo') {
    const label = ETIQUETA_SEGMENTO[item.segmento] ?? item.segmento ?? 'Segmento'
    return `${label} (${item.cantidad})`
  }
  if (Array.isArray(item.destinatarios)) return item.destinatarios[0] || '—'
  if (typeof item.destinatarios === 'string') {
    try {
      const parsed = JSON.parse(item.destinatarios)
      return (Array.isArray(parsed) ? parsed[0] : item.destinatarios) || '—'
    } catch {
      return item.destinatarios || '—'
    }
  }
  return '—'
}

export function HistorialTab() {
  const [seleccionado, setSeleccionado] = useState(null)
  const { data: envios = [], isLoading, isError, error, refetch } = useHistorialComunicaciones()

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }

  if (isError) {
    return (
      <QueryError
        message={error?.message || 'No se pudo cargar el historial de comunicaciones'}
        onRetry={refetch}
      />
    )
  }

  if (envios.length === 0) {
    return (
      <Paper withBorder p="xl" radius="lg">
        <Stack align="center" gap="sm" py="md">
          <IconHistory size={48} color="var(--mantine-color-dimmed)" />
          <Text fw={600}>Todavía no se enviaron comunicaciones.</Text>
        </Stack>
      </Paper>
    )
  }

  return (
    <>
      <Paper withBorder radius="lg" p="md">
        <Table.ScrollContainer minWidth={760}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {COLUMNAS.map((col) => (
                  <Table.Th key={col}>
                    <Text fz="xs" fw={700} tt="uppercase" c="dimmed">{col}</Text>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {envios.map((item) => (
                <Table.Tr
                  key={item.id}
                  onClick={() => setSeleccionado(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td>
                    <Text fz="sm">{formatearFechaHoraEvento(item.creado_en)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      color={item.tipo === 'masivo' ? 'violet' : 'brand'}
                    >
                      {item.tipo === 'masivo' ? 'Masivo' : 'Individual'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm">{describirDestino(item)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" fw={500} lineClamp={1} title={item.asunto}>
                      {item.asunto}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm">{item.cantidad}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" c="green" fw={600}>{item.exitos}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      fz="sm"
                      c={item.fallos > 0 ? 'red' : 'dimmed'}
                      fw={item.fallos > 0 ? 600 : 400}
                    >
                      {item.fallos}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <EnvioDetalleDrawer
        opened={Boolean(seleccionado)}
        onClose={() => setSeleccionado(null)}
        envio={seleccionado}
      />
    </>
  )
}
