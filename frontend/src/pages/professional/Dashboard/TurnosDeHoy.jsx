import { Group, Text, Avatar, Paper, Table, Badge, Anchor } from "@mantine/core"
import { Link } from 'react-router-dom'

const estadoConfig = {
  activo:    { color: 'green', label: 'Activo' },
  cancelado: { color: 'red',   label: 'Cancelado' },
}

export function TurnosDeHoy({ turnos = [] }) {
  return (
    <Paper
      className="col-span-3"
      withBorder
      radius="lg"
      p="lg"
      style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}
    >
      <Group mb="md" align="center">
        <Text fw={700} fz="lg" style={{ flex: 1 }}>Turnos de hoy</Text>
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

      {turnos.length === 0 ? (
        <Text c="dimmed" fz="sm" ta="center" py="xl">No hay turnos para hoy</Text>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Table verticalSpacing="sm">
            <Table.Tbody>
              {turnos.map((t) => {
                const { color, label } = estadoConfig[t.estado] ?? { color: 'gray', label: t.estado }
                return (
                  <Table.Tr key={t.id}>
                    <Table.Td w={80}>
                      <Text fw={700} fz="sm" ff="monospace">{t.hora}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Avatar radius="xl" size="sm" visibleFrom="sm" />
                        <Text fz="sm">{t.paciente}</Text>
                      </Group>
                    </Table.Td>
                    {/* v2: reserved (e.g. specialty / reason) */}
                    <Table.Td visibleFrom="sm" />
                    <Table.Td w={120} ta="center">
                      <Badge
                        variant="dot"
                        color={color}
                        radius="xl"
                        tt="uppercase"
                        style={{ minWidth: 90, justifyContent: 'center' }}
                      >
                        {label}
                      </Badge>
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
