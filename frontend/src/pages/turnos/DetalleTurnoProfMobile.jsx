import { useState } from 'react'
import { Badge, Box, Button, Divider, Drawer, Grid, Group, Paper, Stack, Text, Textarea } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconAlertCircle } from '@tabler/icons-react'
import { cancelTurnoById } from '../../api/clientes.js'
import { fechaCorta, horaCorta } from '../../utils/fechas.utils.js'

function DetailRow({ label, children }) {
  return (
    <>
      <Grid py="md" align="center">
        <Grid.Col span={5}>
          <Text fz="sm" c="dimmed">{label}</Text>
        </Grid.Col>
        <Grid.Col span={7}>
          {children}
        </Grid.Col>
      </Grid>
      <Divider />
    </>
  )
}

// Detalle de UN turno para mobile. Adaptado del detalle del cliente:
// muestra el PACIENTE, cancela con rol 'profesional' y "Atrás" vuelve a la lista
// (in-page) en vez de navegar a otra ruta, para no perder los datos del día.
export function DetalleTurnoProfMobile({ turno, dniProfesional, onVolver, onCancelled }) {
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)
  const [motivo, setMotivo] = useState('')

  const queryClient = useQueryClient()
  const { mutate: cancelar, isPending } = useMutation({
    mutationFn: () => cancelTurnoById({ id: turno.id_turno, motivo: motivo.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda'] })
      onCancelled?.(turno.id_turno)
      closeDrawer()
      onVolver()
    },
  })

  const badgeColor = turno.estado === 'activo' ? 'green' : turno.estado === 'cancelado' ? 'red' : 'gray'

  return (
    <>
      <Stack gap="md">
        <Paper withBorder radius="lg" px="md" pt="xs" pb={0}>
          <DetailRow label="Paciente">
            <Text fz="md" fw={600}>{turno.nombre} {turno.apellido}</Text>
          </DetailRow>
          <DetailRow label="Fecha">
            <Text fz="md" fw={600}>{fechaCorta(turno.fecha_turno)}</Text>
          </DetailRow>
          <DetailRow label="Hora">
            <Text fz="md" fw={600}>{horaCorta(turno.hora_turno)} hs</Text>
          </DetailRow>
          <DetailRow label="Estado">
            <Badge variant="light" color={badgeColor} radius="xl" size="md" tt="uppercase">
              {turno.estado}
            </Badge>
          </DetailRow>
        </Paper>

        {turno.estado === 'activo' && (
          <Button variant="light" color="red" size="md" radius="md" fullWidth onClick={openDrawer}>
            Cancelar turno
          </Button>
        )}

        <Button variant="default" color="gray" size="md" radius="md" onClick={onVolver}>
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
          <Text c="dimmed" fz="sm" lh={1.6} mb="md">
            {fechaCorta(turno.fecha_turno)} · {horaCorta(turno.hora_turno)} · {turno.nombre} {turno.apellido}.{' '}
            Se le avisará al paciente por email.
          </Text>
          <Textarea
            label="Motivo (opcional)"
            placeholder="Se lo incluirá en el email al paciente"
            value={motivo}
            onChange={(e) => setMotivo(e.currentTarget.value)}
            autosize
            minRows={2}
            maxRows={4}
            disabled={isPending}
          />
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
