import { PageHeader } from '../../../components/PageHeader.jsx'
import { Group, Text, Stack, Avatar, Paper, Box, SimpleGrid, Menu } from "@mantine/core"
import { BarChart } from '@mantine/charts'
import { StatCard } from './StatCard.jsx'
import { ProximoTurno } from './ProximoTurno.jsx'
import { TurnosDeHoy } from './TurnosDeHoy.jsx'
import { Link } from 'react-router-dom';

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

function TurnosPorDia() {
  return (
    <Paper withBorder radius="lg" p="lg" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
      <Text fw={700} fz="lg" mb="md">Turnos por día</Text>
      <div style={{ flex: 1, minHeight: 0 }}>
        <BarChart
          h="100%"
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
      </div>
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
          <Group visibleFrom="sm">
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <Avatar radius="xl" style={{ cursor: 'pointer' }} />
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Mi Perfil</Menu.Label>
                <Menu.Item
                  component={Link}
                  to="/miperfil"
                >
                  Configuración
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>


            {/* <Avatar radius="xl" alt="" /> */}
          </Group>
        </Group>
      </PageHeader>

      {/* Mobile layout */}
      <Stack hiddenFrom="sm" gap="sm" p="xs" style={{ flex: 1, overflowY: 'auto' }}>
        <SimpleGrid cols={2}>
          <StatCard label="Turnos hoy" value={6} color="brand" />
          <StatCard label="Slots libres" value={4} color="cyan" />
        </SimpleGrid>
        <TurnosDeHoy />
      </Stack>

      {/* Desktop layout */}
      <Box
        visibleFrom="sm"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'auto 1fr',
          gap: 8,
          minHeight: 0,
        }}
      >
        <StatCard label="Turnos hoy" value={6} color="brand" />
        <StatCard label="Esta semana" value={23} color="accent" />
        <StatCard label="Cancelados (7d)" value={3} color="red" />
        <StatCard label="Slots libres hoy" value={4} color="cyan" />

        {/* col 1–3: fill remaining height, internal scroll */}
        <TurnosDeHoy />

        {/* col 4: ProximoTurno + TurnosPorDia stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <ProximoTurno />
          <TurnosPorDia />
        </div>
      </Box>
    </div>
  )
}
