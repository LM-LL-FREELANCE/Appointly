import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Box, Button, Drawer, Group, Paper, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconAlertCircle } from '@tabler/icons-react';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { cancelTurnoById } from '../../../services/clientes.js';

const DNI = '25890123';

export function DetalleTurnoMobile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { turno, openCancel } = location.state || {};
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(openCancel ?? false);

  const queryClient = useQueryClient();
  const { mutate: cancelar, isPending } = useMutation({
    mutationFn: () => cancelTurnoById(turno.id_turno, DNI, 'cliente'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos', DNI] });
      navigate('/misturnos');
    },
  });

  if (!turno) {
    return (
      <>
        <PageHeader>
          <Text fw={600} fz="xl">Detalle</Text>
        </PageHeader>
        <Paper withBorder radius="lg" p="md">
          <Stack gap="md">
            <Text>No se seleccionó ningún turno para ver detalle.</Text>
            <Button variant="default" onClick={() => navigate('/misturnos')}>Volver a Mis Turnos</Button>
          </Stack>
        </Paper>
      </>
    );
  }

  const badgeColor = turno.estado === 'activo' ? 'green' : turno.estado === 'cancelado' ? 'red' : 'gray';

  return (
    <>
      <PageHeader>
        <Text fw={600} fz="xl">Detalle</Text>
      </PageHeader>

      <Paper withBorder radius="lg" p="md">
        <Stack gap="md">
          <Group justify="flex-end">
            <Badge variant="dot" color={badgeColor} radius="xl" size="lg">
              {turno.estado}
            </Badge>
          </Group>

          <Group gap="sm" wrap="nowrap">
            <Avatar size="lg" radius="xl" />
            <Stack gap={2}>
              <Text fw={700} fz="lg">{turno.p_nombre} {turno.p_apellido}</Text>
              <Text fz="md" c="dimmed">{turno.tipo}</Text>
            </Stack>
          </Group>

          <Stack gap="xs">
            <Text><b>Fecha:</b> {turno.fecha_turno}</Text>
            <Text><b>Hora:</b> {turno.hora_turno} hs</Text>
          </Stack>

          <Group grow gap="sm" mt="xs">
            {turno.estado === 'activo' && (
              <Button variant="light" color="red" size="lg" onClick={openDrawer}>
                Cancelar Turno
              </Button>
            )}
            <Button variant="default" size="lg" onClick={() => navigate(-1)}>Atrás</Button>
          </Group>
        </Stack>
      </Paper>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        position="bottom"
        withCloseButton={false}
        radius="lg"
        size="auto"
        overlayProps={{ backgroundOpacity: 0.3 }}
        styles={{ body: { padding: 0 } }}
      >
        <Box px="lg" pt="lg" pb="md">
          <IconAlertCircle size={28} color="var(--mantine-color-red-5)" style={{ marginBottom: 8 }} />
          <Text fw={700} fz="xl" mb="xs">¿Cancelar turno?</Text>
          <Text c="dimmed" fz="sm" lh={1.6}>
            {turno.fecha_turno} · {turno.hora_turno} · {turno.p_nombre} {turno.p_apellido}.{' '}
            Te avisamos por email.
          </Text>
        </Box>
        <Box px="lg" pb="xl">
          <Stack gap="sm">
            <Button
              fullWidth
              variant="light"
              color="red"
              size="lg"
              radius="xl"
              onClick={() => cancelar()}
              loading={isPending}
            >
              Sí, cancelar
            </Button>
            <Button
              fullWidth
              variant="default"
              size="lg"
              radius="xl"
              onClick={closeDrawer}
              disabled={isPending}
            >
              No, volver
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
