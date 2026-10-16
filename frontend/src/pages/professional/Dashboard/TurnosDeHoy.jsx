import { Group, Text, Paper, Table, Anchor, Divider } from '@mantine/core'
import { Link } from 'react-router-dom'
import { IconTable } from '@tabler/icons-react'
import { UserAvatar } from '../../../components/UserAvatar.jsx'
import { EstadoTurnoBadge } from '../../../components/EstadoTurnoBadge.jsx'

export function TurnosDeHoy({ turnos = [] }) {
  return (
    <Paper
      className="col-span-3"
      withBorder
      radius="lg"
      p="lg"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Group mb="md" align="center" justify="end">
        <Group gap="xs" style={{ flex: 1 }}>
          <IconTable stroke={2} size={16} />
          <Text fw={700} fz="lg">Turnos de hoy</Text>
        </Group>
        <Anchor
          component={Link}
          to="/agenda"
          fz="sm"
          fw={500}
          visibleFrom="sm"
          style={{ width: 120, textAlign: 'center' }}
        >
          Ver agenda →
        </Anchor>
      </Group>
      <Divider size="xs" mt="xs" />

      {turnos.length === 0 ? (
        <Text c="dimmed" fz="sm" ta="center" py="xl">No hay turnos para hoy</Text>
      ) : (
        <div style={{ overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Table verticalSpacing="sm">
            <Table.Tbody>
              {turnos.map((t) => {
                return (
                  <Table.Tr key={t.id}>
                    <Table.Td w={80}>
                      <Text fw={700} fz="sm">{t.hora}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <UserAvatar
                          size={32}
                          radius="100%"
                          withLink={false}
                          src={t.foto_url}
                          name={t.paciente}
                        />
                        <Text fz="sm">{t.paciente}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td visibleFrom="sm" />
                    <Table.Td w={220} ta="center">
                      <EstadoTurnoBadge
                        estado={t.estado}
                        style={{ minWidth: 90, justifyContent: 'center' }}
                      />
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </Paper>
  )
}
