import { Badge, Box, Button, Divider, Grid, Group, Modal, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { getTurnoById } from '../../../services/clientes.js'

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

export function TurnoProDetailModal({ opened, onClose, onCancelRequest, turno, dni }) {
  const { data: detail } = useQuery({
    queryKey: ['turno', turno.id_turno],
    queryFn: () => getTurnoById({ id_turno: turno.id_turno, dni, rol: 'profesional' }),
    enabled: opened,
  })

  const badgeColor = turno.estado === 'activo' ? 'green' : 'red'

  const reservadoEl = detail?.creado_en
    ? new Date(detail.creado_en).toLocaleString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).replace(',', ' ·')
    : null

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="md"
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 7 }}
    >
      <Box px="lg" pt="lg" pb="md">
        <Text fw={700} fz="lg" mb="lg">Detalle del turno</Text>
        <Divider />
        <DetailRow label="Paciente">
          <Text fz="sm" fw={500}>
            {detail ? `${detail.c_nombre} ${detail.c_apellido}` : `${turno.c_nombre} ${turno.c_apellido}`}
          </Text>
        </DetailRow>
        {detail?.tipo && (
          <DetailRow label="Especialidad">
            <Text fz="sm" fw={500}>{detail.tipo}</Text>
          </DetailRow>
        )}
        <DetailRow label="Fecha">
          <Text fz="sm" fw={500}>{turno.fecha_turno?.slice(0, 10)}</Text>
        </DetailRow>
        <DetailRow label="Hora">
          <Text fz="sm" fw={500}>{turno.hora_turno?.slice(0, 5)} hs</Text>
        </DetailRow>
        <DetailRow label="Estado">
          <Badge variant="dot" color={badgeColor} size="md" radius="xl" tt="capitalize">
            {turno.estado}
          </Badge>
        </DetailRow>
        {reservadoEl && (
          <DetailRow label="Reservado el">
            <Text fz="sm" fw={500}>{reservadoEl}</Text>
          </DetailRow>
        )}
      </Box>
      <Box px="lg" py="md">
        <Group justify="flex-end" gap="sm">
          {turno.estado === 'activo' && (
            <Button variant="subtle" color="red" onClick={onCancelRequest}>Cancelar turno</Button>
          )}
          <Button variant="default" onClick={onClose}>Cerrar</Button>
        </Group>
      </Box>
    </Modal>
  )
}
