import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Box, Button, Divider, Drawer, Grid, Group, Paper, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconAlertCircle } from '@tabler/icons-react';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { cancelTurnoById } from '../../../api/clientes.js';

const DNI = '25890123';

function DetailRow({ label, children }) {
  return (
    <>
      <Grid py="md" align="center">
        <Grid.Col span={5}>
          <Text fz="lg" c="dimmed">{label}</Text>
        </Grid.Col>
        <Grid.Col span={7}>
          {children}
        </Grid.Col>
      </Grid>
      <Divider />
    </>
  );
}

export function DetalleTurnoMobile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { turno, tab = 'activo' } = location.state || {};
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  const queryClient = useQueryClient();
  const { mutate: cancelar, isPending } = useMutation({
    mutationFn: () => cancelTurnoById(turno.id_turno, DNI, 'cliente'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos', DNI] });
      navigate('/misturnos', { state: { tab } });
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

      <Stack gap="md">
        <Paper withBorder radius="lg" px="md" pt="xs" pb={0}>
          <DetailRow label="Profesional">
            <Text fz="lg" fw={600}>{turno.p_nombre} {turno.p_apellido}</Text>
          </DetailRow>
          <DetailRow label="Especialidad">
            <Text fz="lg" fw={600}>{turno.tipo}</Text>
          </DetailRow>
          <DetailRow label="Fecha" fz="lg">
            <Text fz="lg" fw={600}>{turno.fecha_turno}</Text>
          </DetailRow>
          <DetailRow label="Hora">
            <Text fz="lg" fw={600}>{turno.hora_turno} hs</Text>
          </DetailRow>
          <DetailRow label="Estado">
            <Badge variant="light" color={badgeColor} radius="xl" size="lg" tt="uppercase">
              {turno.estado}
            </Badge>
          </DetailRow>
        </Paper>

        {turno.estado === 'activo' && (
          <Button variant="light" color="red" size="lg" radius="md" fullWidth onClick={openDrawer}>
            Cancelar turno
          </Button>
        )}

        <Button variant="default" color="gray" size="lg" radius="md" onClick={() => navigate('/misturnos', { state: { tab } })}>
          Atrás
        </Button>
      </Stack>

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
            {turno.fecha_turno} · {turno.hora_turno} · {turno.p_nombre} {turno.p_apellido}.{' '}
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
