import { Avatar, Box, Button, Drawer, Group, Paper, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconAlertCircle } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { cancelTurnoById } from '../../../api/clientes.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { EstadoTurnoBadge } from '../../../components/EstadoTurnoBadge.jsx'

export function TurnoCard({ turno, estado }) {
  const { user } = useAuth()

  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)

  const queryClient = useQueryClient()
  const { mutate: cancelar, isPending } = useMutation({
    mutationFn: () => cancelTurnoById({ id: turno.id_turno, motivo: '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos', user?.dni] })
      closeDrawer()
    },
  })

  return (
    <>
      <Paper withBorder radius="lg" p="md">
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text fw={700} fz="md">{turno.fecha_turno} · {turno.hora_turno}</Text>
            <EstadoTurnoBadge estado={estado} />
          </Group>

          <Group gap="sm" wrap="nowrap">
            <Avatar size="md" radius="xl" />
            <Stack gap={2}>
              <Text fw={600} fz="md">{turno.nombre} {turno.apellido}</Text>
              <Text fz="sm" c="dimmed">{turno.tipo}</Text>
            </Stack>
          </Group>

          <Group grow gap="sm">
            <Button variant="default" radius="md" component={Link} to="/misturnos/detalle" state={{ turno, tab: estado }} size="md">Detalle</Button>
            {estado === 'activo' && (
              <Button variant="light" color="red" radius="md" size="md" onClick={openDrawer}>Cancelar</Button>
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
            <Button fullWidth variant="light" color="red" size="md" radius="xl" onClick={() => cancelar()} loading={isPending}>
              Sí, cancelar
            </Button>
            <Button fullWidth variant="default" size="md" radius="xl" onClick={closeDrawer} disabled={isPending}>
              No, volver
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  )
}
