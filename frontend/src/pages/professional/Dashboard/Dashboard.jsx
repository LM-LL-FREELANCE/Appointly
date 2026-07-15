import { useQuery } from '@tanstack/react-query'
import { useMediaQuery } from '@mantine/hooks'
import { Group, Text, Stack, Avatar, Paper, Box, SimpleGrid, Menu } from "@mantine/core"
import { BarChart } from '@mantine/charts'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../components/PageHeader.jsx'
import { StatCard } from './StatCard.jsx'
import { ProximoTurno } from './ProximoTurno.jsx'
import { TurnosDeHoy } from './TurnosDeHoy.jsx'
import { getProfesionalByDni } from '../../../services/profesionales.js'
import { getTurnosProfesional } from '../../../services/turnos.service.js'
import { aISO } from '../../../utils/fechas.utils.js'
import { useAuth } from '../../../hooks/useAuth.js'

/* const { user } = useAuth()
const CURRENT_DNI = user?.dni || '27845123' */

const DIA_LABEL = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function buildBarData(turnos) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const fecha = aISO(d)
    return {
      dia: DIA_LABEL[d.getDay()],
      turnos: turnos.filter(t => t.fecha_turno?.slice(0, 10) === fecha && t.estado === 'activo').length,
    }
  })
}

function TurnosPorDia({ data }) {
  return (
    <Paper withBorder radius="lg" p="lg" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
      <Text fw={700} fz="lg" mb="md">Turnos por día</Text>
      <div style={{ flex: 1, minHeight: 180 }}>
        <BarChart
          h="100%"
          data={data}
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

  const { user } = useAuth()
  const CURRENT_DNI = user?.dni || "27845123"

  const { data: perfil } = useQuery({
    queryKey: ['perfil', CURRENT_DNI],
    queryFn: () => getProfesionalByDni({ dni: CURRENT_DNI }),
  })

  const startDate = new Date()
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 7)

  const startDateISO = aISO(startDate)
  const endDateISO = aISO(endDate)

  /* const hasta = aISO(hoy.getDate() + 7) */

  const { data: turnos = [] } = useQuery({
    queryKey: ['turnos-profesional', CURRENT_DNI, hoy],
    queryFn: () => getTurnosProfesional({ dni: CURRENT_DNI, desde: hoy, hasta: hasta }),
  })

  const turnosHoy = turnos.filter(t => t.fecha_turno?.slice(0, 10) === hoy && t.estado === 'activo').length
  const estaSemana = turnos.filter(t => t.estado === 'activo').length
  const cancelados7d = turnos.filter(t => t.estado === 'cancelado').length
  const barData = buildBarData(turnos)

  const turnosDeHoy = turnos
    .filter(t => t.fecha_turno?.slice(0, 10) === hoy)
    .map(t => ({
      id: t.id_turno,
      hora: t.hora_turno?.slice(0, 5),
      paciente: `${t.nombre} ${t.apellido}`,
      estado: t.estado,
    }))

  const minAhora = new Date().getHours() * 60 + new Date().getMinutes()
  const proximoTurno = turnos.find(t => {
    if (t.estado !== 'activo') return false
    const fecha = t.fecha_turno?.slice(0, 10)
    if (fecha > hoy) return true
    if (fecha === hoy) {
      const [h, m] = (t.hora_turno ?? '').split(':').map(Number)
      return h * 60 + m >= minAhora
    }
    return false
  }) ?? null

  const isDesktop = useMediaQuery('(min-width: 48em)')
  const saludo = perfil ? `Hola, ${perfil.nombre} ${perfil.apellido}` : 'Hola'

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
            <Text fw={600} fz={{ base: 'xl', sm: 'lg' }}>{saludo}</Text>
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
                <Menu.Item component={Link} to="/miperfil">Configuración</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </PageHeader>

      {/* Mobile layout */}
      <Stack hiddenFrom="sm" gap="sm" p="xs" pb="xl" style={{ flex: 1, overflowY: 'auto' }}>
        <SimpleGrid cols={2}>
          <StatCard label="Turnos hoy" value={turnosHoy} color="brand" />
          <StatCard label="Esta semana" value={estaSemana} color="accent" />
          <StatCard label="Cancelados (7d)" value={cancelados7d} color="red" />
          <StatCard label="Slots libres" value={0} color="cyan" />
        </SimpleGrid>
        <ProximoTurno turno={proximoTurno} />
        <TurnosDeHoy turnos={turnosDeHoy} />
        <TurnosPorDia data={barData} />
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
        <StatCard label="Turnos hoy" value={turnosHoy} color="brand" />
        <StatCard label="Esta semana" value={estaSemana} color="accent" />
        <StatCard label="Cancelados (7d)" value={cancelados7d} color="red" />
        <StatCard label="Slots libres hoy" value={0} color="cyan" />

        <TurnosDeHoy turnos={turnosDeHoy} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <ProximoTurno turno={proximoTurno} />
          {isDesktop && <TurnosPorDia data={barData} />}
        </div>
      </Box>
    </div>
  )
}
