import { Badge, Button, Center, Group, Loader, Paper, ScrollArea, Select, SimpleGrid, Stack, Table, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconMailPlus } from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'
import QueryError from '../../components/QueryError.jsx'
import { useCrearInvitacion, useInvitaciones, useRevocarInvitacion } from '../../hooks/useAdmin.jsx'
import useGetErrosMsg from '../../hooks/useGetErrosMsg.jsx'
import { formatFechaHora } from '../../utils/fechas.admin.js'

const ESTADO_BADGE = {
  pendiente: { color: 'blue', label: 'Pendiente' },
  usada: { color: 'green', label: 'Usada' },
  vencida: { color: 'gray', label: 'Vencida' },
  revocada: { color: 'red', label: 'Revocada' },
}

export default function AdminInvitaciones() {
  const { data: invitaciones = [], isPending, isError, error, refetch } = useInvitaciones()
  const { mutate: crear, isPending: isCreating } = useCrearInvitacion()
  const { mutate: revocar, isPending: isRevoking } = useRevocarInvitacion()
  const { errorMessage } = useGetErrosMsg()

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { dni: '', correo: '', role: 'profesional' },
    validate: {
      dni: (v) => (/^\d{7,8}$/.test(v.trim()) ? null : 'El DNI debe tener 7 u 8 dígitos'),
      correo: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Formato de email incorrecto'),
      role: (v) => (v === 'profesional' || v === 'admin' ? null : 'Seleccioná un rol válido'),
    },
  })

  const notifyError = (title) => (err) =>
    notifications.show({ color: 'red', title, message: errorMessage(err.code), position: 'top-right' })

  // `dni` can be a number (rows from the API) or a string (the form).
  const invitar = ({ dni, correo, role = 'profesional' }, { reset = false } = {}) => crear(
    { dni: String(dni).trim(), correo: correo.trim(), role },
    {
      onSuccess: () => {
        if (reset) form.reset()
        notifications.show({
          color: 'green', icon: <IconCheck />, title: 'Invitación enviada',
          message: `Enviamos el enlace a ${correo.trim()}. Vale 24 horas y se usa una sola vez.`, position: 'top-right',
        })
      },
      onError: notifyError('No se pudo enviar la invitación'),
    },
  )

  let content
  if (isPending) {
    content = <Center h="30vh"><Loader /></Center>
  } else if (isError) {
    content = <QueryError message={error.message} onRetry={refetch} />
  } else if (invitaciones.length === 0) {
    content = <Center h="20vh"><Text c="dimmed">Todavía no enviaste invitaciones.</Text></Center>
  } else {
    content = (
      <Paper withBorder radius="md">
        <ScrollArea>
          <Table verticalSpacing="sm" highlightOnHover miw={760}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>DNI</Table.Th>
                <Table.Th>Correo</Table.Th>
                <Table.Th>Rol</Table.Th>
                <Table.Th>Enviada</Table.Th>
                <Table.Th>Vence</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {invitaciones.map((inv) => {
                const badge = ESTADO_BADGE[inv.estado]
                const reenviable = inv.estado === 'vencida' || inv.estado === 'revocada'
                return (
                  <Table.Tr key={inv.id}>
                    <Table.Td>{inv.dni}</Table.Td>
                    <Table.Td>{inv.correo}</Table.Td>
                    <Table.Td>
                      <Badge variant="outline" color={inv.role === 'admin' ? 'violet' : 'teal'}>
                        {inv.role === 'admin' ? 'Admin' : 'Profesional'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatFechaHora(inv.creada_en)}</Table.Td>
                    <Table.Td>{formatFechaHora(inv.expira_en)}</Table.Td>
                    <Table.Td><Badge variant="light" color={badge.color}>{badge.label}</Badge></Table.Td>
                    <Table.Td>
                      <Group justify="flex-end" wrap="nowrap">
                        {inv.estado === 'pendiente' && (
                          <Button size="xs" variant="light" color="red" disabled={isRevoking}
                            onClick={() => revocar({ id: inv.id }, { onError: notifyError('No se pudo revocar') })}>
                            Revocar
                          </Button>
                        )}
                        {reenviable && (
                          <Button size="xs" variant="light" disabled={isCreating} onClick={() => invitar(inv)}>
                            Reenviar
                          </Button>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    )
  }

  return (
    <>
      <PageHeader title="Invitaciones" subtitle="Invitá a una persona a ser profesional o administradora. El enlace vale 24 horas y se usa una sola vez." />
      <Stack gap="lg">
        <Paper withBorder radius="md" p="md">
          <form onSubmit={form.onSubmit((values) => invitar(values, { reset: true }))} noValidate>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" style={{ alignItems: 'flex-end' }}>
              <TextInput label="DNI" placeholder="Ej: 12345678" required key={form.key('dni')} {...form.getInputProps('dni')} />
              <TextInput label="Correo" placeholder="Ej: persona@correo.com" required key={form.key('correo')} {...form.getInputProps('correo')} />
              <Select
                label="Rol"
                data={[
                  { value: 'profesional', label: 'Profesional' },
                  { value: 'admin', label: 'Administrador' },
                ]}
                required
                allowDeselect={false}
                key={form.key('role')}
                {...form.getInputProps('role')}
              />
              <Button type="submit" leftSection={<IconMailPlus size={18} />} loading={isCreating}>Enviar invitación</Button>
            </SimpleGrid>
          </form>
        </Paper>
        {content}
      </Stack>
    </>
  )
}
