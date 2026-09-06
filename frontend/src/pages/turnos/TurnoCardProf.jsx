import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core'
import { fechaCorta, horaCorta } from '../../utils/fechas.utils.js'
import { UserAvatar } from '../../components/UserAvatar.jsx'

export function TurnoCardProf({ turno, onVerDetalle }) {
  const badgeColor = turno.estado === 'activo' ? 'green' : turno.estado === 'cancelado' ? 'red' : 'gray'
  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text fw={700} fz="md">{fechaCorta(turno.fecha_turno)} · {horaCorta(turno.hora_turno)}</Text>
          <Badge variant="dot" color={badgeColor} radius="xl" size="md" tt="uppercase">
            {turno.estado}
          </Badge>
        </Group>

        <Group gap="sm" wrap="nowrap">
          <UserAvatar
            size="md"
            radius="100%"
            withLink={false}
            src={turno.foto_url}
            name={`${turno.nombre ?? ''} ${turno.apellido ?? ''}`.trim()}
          />
          <Text fw={600} fz="md">{turno.nombre} {turno.apellido}</Text>
        </Group>

        <Button variant="default" radius="md" size="md" onClick={() => onVerDetalle(turno)}>
          Ver detalle
        </Button>
      </Stack>
    </Paper>
  )
}
