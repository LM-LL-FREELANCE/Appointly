import { useState } from 'react'
import { Badge, Button, Center, Group, Loader, Modal, Paper, ScrollArea, Stack, Table, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconUserCheck, IconX } from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'
import QueryError from '../../components/QueryError.jsx'
import { useResolverSolicitud, useSolicitudes } from '../../hooks/useAdmin.jsx'
import useGetErrosMsg from '../../hooks/useGetErrosMsg.jsx'
import { formatFechaHora } from '../../utils/fechas.admin.js'

export default function AdminSolicitudes() {
  const { data: solicitudes = [], isPending, isError, error, refetch } = useSolicitudes()
  const { mutate, isPending: isResolving } = useResolverSolicitud()
  const { errorMessage } = useGetErrosMsg()
  const [aRechazar, setARechazar] = useState(null)

  const resolver = (solicitud, accion) => mutate(
    { dni: solicitud.dni, role: solicitud.role, accion },
    {
      onSuccess: () => {
        setARechazar(null)
        notifications.show({
          color: accion === 'aprobar' ? 'green' : 'gray',
          icon: accion === 'aprobar' ? <IconCheck /> : <IconX />,
          title: accion === 'aprobar' ? 'Solicitud aprobada' : 'Solicitud rechazada',
          message: `${solicitud.nombre} ${solicitud.apellido}`,
          position: 'top-right',
        })
      },
      onError: (err) => {
        setARechazar(null)
        notifications.show({ color: 'red', title: 'No se pudo resolver', message: errorMessage(err.code), position: 'top-right' })
        refetch()
      },
    },
  )

  let content
  if (isPending) {
    content = <Center h="50vh"><Loader /></Center>
  } else if (isError) {
    content = <QueryError message={error.message} onRetry={refetch} />
  } else if (solicitudes.length === 0) {
    content = (
      <Center h="50vh">
        <Stack align="center" gap="xs">
          <IconUserCheck size={40} stroke={1.5} />
          <Text c="dimmed">No hay solicitudes pendientes.</Text>
        </Stack>
      </Center>
    )
  } else {
    content = (
      <Paper withBorder radius="md">
        <ScrollArea>
          <Table verticalSpacing="sm" highlightOnHover miw={760}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Profesional</Table.Th>
                <Table.Th>DNI</Table.Th>
                <Table.Th>Matrícula</Table.Th>
                <Table.Th>Correo</Table.Th>
                <Table.Th>Solicitada</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {solicitudes.map((s) => (
                <Table.Tr key={`${s.dni}-${s.role}`}>
                  <Table.Td><Text fw={500}>{s.nombre} {s.apellido}</Text></Table.Td>
                  <Table.Td>{s.dni}</Table.Td>
                  <Table.Td>{s.numero_matricula ?? <Badge variant="light" color="gray">{s.role}</Badge>}</Table.Td>
                  <Table.Td>{s.correo}</Table.Td>
                  <Table.Td>{formatFechaHora(s.creado_en)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                      <Button size="xs" variant="light" color="red" disabled={isResolving} onClick={() => setARechazar(s)}>
                        Rechazar
                      </Button>
                      <Button size="xs" disabled={isResolving} onClick={() => resolver(s, 'aprobar')}>
                        Aprobar
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    )
  }

  return (
    <>
      <PageHeader title="Solicitudes" subtitle="Profesionales que pidieron una cuenta y esperan tu aprobación." />
      {content}

      <Modal opened={!!aRechazar} onClose={() => setARechazar(null)} title="Rechazar solicitud" centered>
        <Stack>
          <Text size="sm">
            Vas a rechazar la solicitud de <b>{aRechazar?.nombre} {aRechazar?.apellido}</b>. Se borra la solicitud
            y su DNI y matrícula quedan libres para volver a intentarlo.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setARechazar(null)}>Cancelar</Button>
            <Button color="red" loading={isResolving} onClick={() => resolver(aRechazar, 'rechazar')}>Rechazar</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
