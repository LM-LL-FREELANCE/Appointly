import { Avatar, Badge, Button, Group, Paper, Stack, Text } from '@mantine/core'
import { fechaCorta, horaCorta } from '../../utils/fechas.utils.js'

// Tarjeta de lista para mobile. Solo muestra el resumen del turno del paciente;
// el detalle (y la cancelación) se abren al tocar "Ver detalle".
export function TurnoCardProf({ turno, onVerDetalle }) {
  const badgeColor = turno.estado === 'activo' ? 'green' : turno.estado === 'cancelado' ? 'red' : 'gray'
  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text fw={700} fz="md">{fechaCorta(turno.fecha_turno)} · {horaCorta(turno.hora_turno)}</Text>
          <Badge variant="dot" color={badgeColor} radius="xl" size="md" tt="uppercase">
            {turno.estado}
          </Badge>
        </Group>

        <Group gap="sm" wrap="nowrap">
          <Avatar size="md" radius="xl" />
          <Text fw={600} fz="md">{turno.nombre} {turno.apellido}</Text>
        </Group>

        <Button variant="default" radius="md" size="md" onClick={() => onVerDetalle(turno)}>
          Ver detalle
        </Button>
      </Stack>
    </Paper>
  )
}
