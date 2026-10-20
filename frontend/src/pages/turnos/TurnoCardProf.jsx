import { Button, Group, Paper, Stack, Text } from '@mantine/core'
import { fechaCorta, horaCorta } from '../../utils/fechas.utils.js'
import { UserAvatar } from '../../components/UserAvatar.jsx'
import { EstadoTurnoBadge } from '../../components/EstadoTurnoBadge.jsx'

export function TurnoCardProf({ turno, onVerDetalle }) {
  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text fw={700} fz="md">{fechaCorta(turno.fecha_turno)} · {horaCorta(turno.hora_turno)}</Text>
          <EstadoTurnoBadge estado={turno.estado} />
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
