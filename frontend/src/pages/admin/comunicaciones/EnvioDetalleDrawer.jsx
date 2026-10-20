import { Badge, Divider, Drawer, Group, Paper, ScrollArea, Stack, Text } from '@mantine/core'
import { formatearFechaHoraEvento } from '../../../utils/fechas.utils.js'

const ETIQUETA_SEGMENTO = {
  todos: 'Todos los usuarios',
  profesionales: 'Profesionales',
  clientes_turnos_activos: 'Clientes con turnos en un período',
}

function normalizarDestinatarios(raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : [raw]
    } catch {
      return [raw]
    }
  }
  return []
}

export function EnvioDetalleDrawer({ opened, onClose, envio }) {
  if (!envio) return null

  const destinatarios = normalizarDestinatarios(envio.destinatarios)
  const nombreEmisor = [envio.emisor_nombre, envio.emisor_apellido].filter(Boolean).join(' ')
  const emisorTexto = nombreEmisor
    ? `${nombreEmisor} (DNI ${envio.dni_admin})`
    : (envio.dni_admin ? `DNI ${envio.dni_admin}` : 'Sistema')

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title={<Text fw={700} fz="lg">Detalle de comunicación</Text>}
      overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Badge
            variant="light"
            color={envio.tipo === 'masivo' ? 'violet' : 'brand'}
          >
            {envio.tipo === 'masivo' ? 'Masivo' : 'Individual'}
          </Badge>
          <Text fz="xs" c="dimmed">
            {formatearFechaHoraEvento(envio.creado_en)}
          </Text>
        </Group>

        <Stack gap={4}>
          <Text fz="xs" c="dimmed" fw={600} tt="uppercase">Asunto</Text>
          <Text fw={600} fz="md">{envio.asunto}</Text>
        </Stack>

        <Stack gap={4}>
          <Text fz="xs" c="dimmed" fw={600} tt="uppercase">Mensaje</Text>
          <Paper withBorder p="md" radius="md">
            <Text fz="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {envio.cuerpo}
            </Text>
          </Paper>
        </Stack>

        <Divider />

        <Group justify="space-between">
          <Stack gap={2}>
            <Text fz="xs" c="dimmed" fw={600} tt="uppercase">Emisor</Text>
            <Text fz="sm">{emisorTexto}</Text>
          </Stack>

          <Group gap="lg">
            <Stack gap={2} align="center">
              <Text fz="xs" c="dimmed" fw={600} tt="uppercase">Envíos</Text>
              <Text fz="sm" fw={600}>{envio.cantidad}</Text>
            </Stack>
            <Stack gap={2} align="center">
              <Text fz="xs" c="dimmed" fw={600} tt="uppercase">Éxitos</Text>
              <Text fz="sm" fw={600} c="green">{envio.exitos}</Text>
            </Stack>
            <Stack gap={2} align="center">
              <Text fz="xs" c="dimmed" fw={600} tt="uppercase">Fallos</Text>
              <Text fz="sm" fw={600} c={envio.fallos > 0 ? 'red' : 'dimmed'}>
                {envio.fallos}
              </Text>
            </Stack>
          </Group>
        </Group>

        {envio.tipo === 'masivo' && envio.segmento && (
          <Stack gap={2}>
            <Text fz="xs" c="dimmed" fw={600} tt="uppercase">Segmento</Text>
            <Text fz="sm">{ETIQUETA_SEGMENTO[envio.segmento] ?? envio.segmento}</Text>
          </Stack>
        )}

        <Stack gap={6}>
          <Text fz="xs" c="dimmed" fw={600} tt="uppercase">
            Destinatarios ({destinatarios.length})
          </Text>
          <Paper withBorder p="sm" radius="md">
            <ScrollArea.Autosize mah={300}>
              <Stack gap={4}>
                {destinatarios.map((correo) => (
                  <Text key={correo} fz="xs" ff="monospace">
                    {correo}
                  </Text>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          </Paper>
        </Stack>
      </Stack>
    </Drawer>
  )
}
