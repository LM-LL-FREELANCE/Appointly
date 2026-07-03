import { PageHeader } from '../components/PageHeader.jsx'
import { Group, Text, Stack, Avatar, Paper, Table, Button, Badge, Anchor, Divider } from "@mantine/core"
import { BarChart } from '@mantine/charts'
import { Link } from 'react-router-dom'
import { StatCard } from './client/MisTurnos/StatCard.jsx'

const estadoConfig = {
  activo: { color: 'green', label: 'Activo' },
  cancelado: { color: 'red', label: 'Cancelado' },
  libre: { color: 'gray', label: 'Libre' },
}

const turnosHoy = [
  { id: 1, hora: '09:00', paciente: 'J. Gómez', estado: 'activo' },
  { id: 2, hora: '09:30', paciente: 'M. Díaz', estado: 'activo' },
  { id: 3, hora: '10:00', paciente: 'L. Torres', estado: 'cancelado' },
  { id: 4, hora: '10:30', paciente: null, estado: 'libre' },
  { id: 5, hora: '11:00', paciente: 'R. Suárez', estado: 'activo' },
]

const turnosPorDia = [
  { dia: 'L', turnos: 8 },
  { dia: 'M', turnos: 5 },
  { dia: 'X', turnos: 10 },
  { dia: 'J', turnos: 7 },
  { dia: 'V', turnos: 12 },
  { dia: 'L', turnos: 6 },
  { dia: 'M', turnos: 9 },
  { dia: 'X', turnos: 4 },
  { dia: 'J', turnos: 11 },
  { dia: 'V', turnos: 8 },
]

function ProximoTurno() {
  return (
    <Paper withBorder radius="lg" p="lg" style={{ flex: 3 }} >
      <Stack gap="md">
        <Text fw={700} fz="lg">Próximo turno</Text>
        <Group gap="lg" pb="md">
          <Avatar radius="xl" size="lg" />
          <Stack gap={2}>
            <Text fw={700}>J. Gómez</Text>
            <Text c="dimmed" fz="sm">09:00 · Kinesiología</Text>
          </Stack>
        </Group>
        <Divider pb="md" />
        <Group grow gap="lg">
          <Button variant="default" radius="md">Detalle</Button>
          <Button variant="light" color="red" radius="md">Cancelar</Button>
        </Group>
      </Stack>
    </Paper>
  )
}

function TurnosPorDia() {
  return (
    <Paper withBorder radius="lg" p="lg" style={{ flex: 2 }}>
      <Stack gap="md">
        <Text fw={700} fz="lg">Turnos por día</Text>
        <BarChart
          h={120}
          data={turnosPorDia}
          dataKey="dia"
          series={[{ name: 'turnos', color: 'brand.6' }]}
          tickLine="none"
          gridAxis="none"
          withXAxis
          withYAxis={false}
          withTooltip={false}
          withLegend={false}
          barProps={{ radius: 4 }}
        />
      </Stack>
    </Paper>
  )
}

export default function Dashboard() {
  return (
    <div style={{
      height: 'calc(100dvh - var(--app-shell-padding) * 2)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <PageHeader>
        <Group justify="space-between" style={{ flex: 1 }}>
          <Stack gap={0}>
            <Text fw={600} fz={{ base: 'xl', sm: 'lg' }}>Hola, Dra. Pérez</Text>
            <Text c="dimmed" visibleFrom="md" fz={{ base: 'md', sm: 'sm' }}>
              {new Date().toLocaleDateString('es-AR', {
                timeZone: 'UTC',
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </Stack>
          <Group>
            <Avatar radius="xl" alt="" />
          </Group>
        </Group>
      </PageHeader>

      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'auto 1fr',
        gap: 8,
        minHeight: 0,
      }}>
        <StatCard label="Turnos hoy" value={6} color="brand" />
        <StatCard label="Esta semana" value={23} color="accent" />
        <StatCard label="Cancelados (7d)" value={3} color="red" />
        <StatCard label="Slots libres hoy" value={4} color="cyan" />

        {/* col 1–3: fill remaining height, scroll interno sin scrollbar */}
        <Paper
          className="col-span-3"
          withBorder
          radius="lg"
          p="lg"
          style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}
        >
          <Group mb="md" align="center">
            <Text fw={700} fz="lg" style={{ flex: 1 }}>Turnos de hoy</Text>
            {/* w=120 espeja el ancho de la col de estado para alinear visualmente */}
            <Anchor
              component={Link}
              to="/agenda"
              fz="sm"
              fw={500}
              style={{ width: 120, textAlign: 'center' }}
            >
              Ver agenda →
            </Anchor>
          </Group>

          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <Table verticalSpacing="sm">
              <Table.Tbody>
                {turnosHoy.map((t) => {
                  const { color, label } = estadoConfig[t.estado]
                  return (
                    <Table.Tr key={t.id}>
                      <Table.Td w={80}>
                        <Text fw={700} fz="sm" ff="monospace">{t.hora}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <Avatar radius="xl" size="sm" />
                          <Text fz="sm">{t.paciente ?? '—'}</Text>
                        </Group>
                      </Table.Td>
                      {/* v2: reservado (ej. especialidad / motivo) */}
                      <Table.Td />
                      <Table.Td w={120} ta="center">
                        <Badge
                          variant="dot"
                          color={color}
                          radius="xl"
                          style={{ textTransform: 'none', minWidth: 90, justifyContent: 'center' }}
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
        </Paper>

        {/* col 4: ProximoTurno + TurnosPorDia apilados, TurnosPorDia crece */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <ProximoTurno />
          <TurnosPorDia />
        </div>
      </div>
    </div>
  )
}
