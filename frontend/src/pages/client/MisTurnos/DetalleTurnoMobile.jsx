import { useLocation, Link } from 'react-router-dom';
import { Paper, Text, Button, Stack, Group, Avatar, Badge } from '@mantine/core';

export function DetalleTurnoMobile() {
  const location = useLocation();
  const { turno } = location.state || {};

  if (!turno) {
    return (
      <Paper withBorder radius="lg" p="md">
        <Stack gap="md">
          <Text>No se seleccionó ningún turno para ver detalle.</Text>
          <Button variant="default" component={Link} to="/misturnos">Volver a Mis Turnos</Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text fw={700} fz="xl">Detalle del Turno</Text>
          <Badge variant="dot" color={turno.estado === 'activo' ? 'green' : 'red'} radius="xl" size="lg">
            {turno.estado}
          </Badge>
        </Group>

        <Group gap="sm" wrap="nowrap" mt="xs">
          <Avatar size="lg" radius="xl" />
          <Stack gap={2}>
            <Text fw={700} fz="lg">{turno.p_nombre} {turno.p_apellido}</Text>
            <Text fz="md" c="dimmed">{turno.tipo}</Text>
          </Stack>
        </Group>

        <Stack gap="xs" mt="sm">
          <Text><b>Fecha:</b> {turno.fecha_turno}</Text>
          <Text><b>Hora:</b> {turno.hora_turno} hs</Text>
        </Stack>

        <Group grow gap="sm" mt="md">
          {turno.estado === 'activo' && (
            <Button 
              component={Link} 
              to="../cancelar" 
              state={{ turno }} 
              variant="light" 
              color="red" 
              size="lg"
            >
              Cancelar Turno
            </Button>
          )}
          <Button variant="default" component={Link} to="/misturnos" size="lg">Atrás</Button>
        </Group>
      </Stack>
    </Paper>
  );
}
