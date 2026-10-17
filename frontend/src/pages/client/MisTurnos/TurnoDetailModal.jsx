import { Box, Button, Divider, Grid, Group, Modal, Text } from '@mantine/core'
import { useQuery } from "@tanstack/react-query"
import { getTurnoById } from "../../../api/clientes.js"
import QueryError from '../../../components/QueryError.jsx'
import { EstadoTurnoBadge } from '../../../components/EstadoTurnoBadge.jsx'
import { esCancelable } from '../../../utils/estadosTurno.js'

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

export function TurnoDetailModal({ opened, onClose, onCancelRequest, turno }) {
  const { data: detail, isError, error, refetch } = useQuery({
    queryKey: ['turno', turno?.id_turno],
    queryFn: () => getTurnoById(turno?.id_turno),
    enabled: opened && !!turno?.id_turno,
  })

  const reservadoEl = detail?.fecha_turno
    ? new Date(detail.fecha_turno).toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', ' ·')
    : null

  const fechaFormateada = turno.fecha_turno
    ? new Date(turno.fecha_turno).toLocaleDateString('es-AR', {
      timeZone: 'UTC',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    : '';

  const horaFormateada = turno.hora_turno
    ? turno.hora_turno.slice(0, 5)
    : '';

  const especialidadText = turno.tipo ||
    (typeof turno.especialidades === 'string'
      ? turno.especialidades.replace(/\|/g, ', ')
      : (Array.isArray(turno.especialidades) ? turno.especialidades.join(', ') : '')) ||
    'Sin especificar';
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
        {isError ? (
          <QueryError message={error?.message || "No se pudo cargar el detalle del turno"} onRetry={refetch} />
        ) : (
          <>
            <DetailRow label="Profesional">
              <Text fz="sm" fw={500}>{turno.nombre} {turno.apellido}</Text>
            </DetailRow>
            <DetailRow label="Especialidad">
              <Text fz="sm" fw={500}>{especialidadText}</Text>
            </DetailRow>
            <DetailRow label="Fecha">
              <Text fz="sm" fw={500} tt="capitalize">{fechaFormateada}</Text>
            </DetailRow>
            <DetailRow label="Hora">
              <Text fz="sm" fw={500}>{horaFormateada} hs</Text>
            </DetailRow>
            <DetailRow label="Estado">
              <EstadoTurnoBadge estado={turno.estado} />
            </DetailRow>
            {reservadoEl && (
              <DetailRow label="Reservado el">
                <Text fz="sm" fw={500}>{reservadoEl}</Text>
              </DetailRow>
            )}
          </>
        )}
      </Box>
      <Box px="lg" py="md">
        <Group justify="flex-end" gap="sm">
          {esCancelable(turno.estado) && !turno.esPasado && (
            <Button variant="subtle" color="red" onClick={onCancelRequest}>Cancelar turno</Button>
          )}
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
