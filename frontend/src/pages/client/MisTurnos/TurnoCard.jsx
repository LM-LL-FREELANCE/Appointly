import { Avatar, Badge, Box, Button, Drawer, Group, Paper, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconAlertCircle } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { cancelTurnoById } from '../../../api/clientes.js'
import { useAuth } from '../../../hooks/useAuth.js'

export function TurnoCard({ turno, estado }) {
  const { user } = useAuth()

  const badgeColor = estado === 'activo' ? 'green' : estado === 'cancelado' ? 'red' : 'gray';
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  const queryClient = useQueryClient();
  const { mutate: cancelar, isPending } = useMutation({
    mutationFn: () => cancelTurnoById({ id: turno.id_turno, motivo: '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos', user?.dni] });
      closeDrawer();
    },
  });

  return (
    <>
      <Paper withBorder radius="lg" p="md">
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text fw={700} fz="lg">{turno.fecha_turno} · {turno.hora_turno}</Text>
            <Badge variant="dot" color={badgeColor} radius="xl" size="lg" tt="uppercase">
              {estado}
            </Badge>
          </Group>

          <Group gap="sm" wrap="nowrap">
            <Avatar size="lg" radius="xl" />
            <Stack gap={2}>
              <Text fw={700} fz="lg">{turno.nombre} {turno.apellido}</Text>
              <Text fz="lg">{turno.tipo}</Text>
            </Stack>
          </Group>

          <Group grow gap="sm">
            <Button variant="default" radius="md" component={Link} to="/misturnos/detalle" state={{ turno, tab: estado }} size="lg">Detalle</Button>
            {estado === 'activo' && (
              <Button variant="light" color="red" radius="md" size="lg" onClick={openDrawer}>Cancelar</Button>
            )}
          </Group>
        </Stack>
      </Paper>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        position="bottom"
        withCloseButton={false}
        radius="lg"
        size="50%"
        overlayProps={{ backgroundOpacity: 0.3 }}
        styles={{ body: { padding: 0 } }}
      >
        <Box px="lg" pt="lg" pb="md">
          <Group gap="sm" mb="xs" align="center" wrap="nowrap">
            <IconAlertCircle size={28} color="var(--mantine-color-red-5)" style={{ flexShrink: 0 }} />
            <Text fw={700} fz="xl">¿Cancelar turno?</Text>
          </Group>
          <Text c="dimmed" fz="sm" lh={1.6}>
            {turno.fecha_turno} · {turno.hora_turno} · {turno.nombre} {turno.apellido}.{' '}
            Te avisamos por email.
          </Text>
        </Box>
        <Box px="lg" pb="xl">
          <Stack gap="sm">
            <Button fullWidth variant="light" color="red" size="lg" radius="xl" onClick={() => cancelar()} loading={isPending}>
              Sí, cancelar
            </Button>
            <Button fullWidth variant="default" size="lg" radius="xl" onClick={closeDrawer} disabled={isPending}>
              No, volver
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
