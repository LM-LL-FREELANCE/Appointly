import { Badge, Box, Button, Divider, Grid, Group, Modal, Text } from '@mantine/core'
import { useQuery } from "@tanstack/react-query"
import { getTurnoById } from "../../../services/clientes.js"

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

export function TurnoDetailModal({ opened, onClose, turno, dni }) {
  const { data: detail } = useQuery({
    queryKey: ['turno', turno.id_turno],
    queryFn: () => getTurnoById({ id_turno: turno.id_turno, dni, rol: 'cliente' }),
  })

  const badgeColor = turno.estado === 'activo' ? 'green' : turno.estado === 'cancelado' ? 'red' : 'gray'

  const reservadoEl = detail?.creado_en
    ? new Date(detail.creado_en).toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        <DetailRow label="Profesional">
          <Text fz="sm" fw={500}>{turno.p_nombre} {turno.p_apellido}</Text>
        </DetailRow>
        <DetailRow label="Especialidad">
          <Text fz="sm" fw={500}>{turno.tipo}</Text>
        </DetailRow>
        <DetailRow label="Fecha">
          <Text fz="sm" fw={500}>{turno.fecha_turno}</Text>
        </DetailRow>
        <DetailRow label="Hora">
          <Text fz="sm" fw={500}>{turno.hora_turno} hs</Text>
        </DetailRow>
        <DetailRow label="Estado">
          <Badge variant={turno.estado === "completado" ? "light" : "dot"} color={badgeColor} size="md" radius="xl" tt="capitalize">
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
          <Button variant="subtle" color="red">Cancelar turno</Button>
          <Button variant="default" onClick={onClose}>Cerrar</Button>
        </Group>
      </Box>
    </Modal>
  )
}

/*
// Table-based version
//
// const rows = [
//   { etiqueta: 'Profesional', valor: `${turno.p_nombre} ${turno.p_apellido}` },
//   { etiqueta: 'Especialidad', valor: turno.tipo },
//   { etiqueta: 'Fecha', valor: turno.fecha_turno },
//   { etiqueta: 'Hora', valor: `${turno.hora_turno} hs` },
//   { etiqueta: 'Estado', valor: <Badge ...>{turno.estado}</Badge> },
//   ...(reservadoEl ? [{ etiqueta: 'Reservado el', valor: reservadoEl }] : []),
// ]
//
// <Table verticalSpacing="sm">
//   <Table.Tbody>
//     {rows.map((row) => (
//       <Table.Tr key={row.etiqueta}>
//         <Table.Td c="dimmed" w="35%" fz="sm">{row.etiqueta}</Table.Td>
//         <Table.Td fw={500} fz="sm">{row.valor}</Table.Td>
//       </Table.Tr>
//     ))}
//   </Table.Tbody>
// </Table>
*/
