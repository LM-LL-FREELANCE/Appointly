import { Avatar, Badge, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom'

export function TurnoCard({ turno, estado }) {
  const badgeColor = estado === 'activo' ? 'green' : estado === 'cancelado' ? 'red' : 'gray'

  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text fw={700} fz="lg">{turno.fecha_turno} · {turno.hora_turno}</Text>
          <Badge variant="dot" color={badgeColor} radius="xl" size="lg">
            {estado}
          </Badge>
        </Group>

        <Group gap="sm" wrap="nowrap">
          <Avatar size="lg" radius="xl" /* src={avatarSrc ?? null} */ />
          <Stack gap={2}>
            <Text fw={700} fz="lg">{turno.p_nombre} {turno.p_apellido}</Text>
            <Text fz="lg">{turno.tipo}</Text>
          </Stack>
        </Group>

        <Group grow gap="sm">
          <Button variant="default" radius="md" component={Link} to="detalle" state={{ turno }} size="lg">Detalle</Button>
          <Button variant="light" color="red" radius="md" component={Link} to="cancelar" state={{ turno }} size="lg">Cancelar</Button>
        </Group>
      </Stack>
    </Paper>
  );
}
