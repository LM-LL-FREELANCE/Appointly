import { useQuery } from '@tanstack/react-query'
import { Group, Text, Stack, Paper, Box, SimpleGrid, Divider } from '@mantine/core'
import { BarChart } from '@mantine/charts'
import { PageHeader } from '../../../components/PageHeader.jsx'
import { StatCard } from './StatCard.jsx'
import { ProximoTurno } from './ProximoTurno.jsx'
import { TurnosDeHoy } from './TurnosDeHoy.jsx'
import { getProfesionalByDni, getTurnosByProfesional } from '../../../api/profesionales.js'
import { aISO } from '../../../utils/fechas.utils.js'
import { useAuth } from '../../../hooks/useAuth.js'
import useSlots from '../../../hooks/useSlots.jsx'
import { useIsDesktop } from '../../../hooks/useIsDesktop.js'
import { IconChartBar } from '@tabler/icons-react'
import QueryError from '../../../components/QueryError.jsx'

const DIA_LABEL = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function buildBarData(turnos) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const fecha = aISO(d)
    return {
      dia: DIA_LABEL[d.getDay()],
      turnos: turnos.filter((t) => t.fecha_turno?.slice(0, 10) === fecha && t.estado === 'activo').length,
    }
  })
}

function TurnosPorDia({ data }) {
  return (
    <Paper withBorder radius="lg" p="lg" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
      <Group gap="xs" style={{ flexDirection: 'row' }}>
        <IconChartBar size={16} stroke={2} />
        <Text fw={700} fz="lg">Turnos por día</Text>
      </Group>
      <Divider my="md" size="xs" />
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

  const { data: perfil, isError: isErrorPerfil, error: errorPerfil, refetch: refetchPerfil } = useQuery({
    queryKey: ['perfil', user?.dni],
    queryFn: () => getProfesionalByDni({ dni: user?.dni }),
  })

  const startDate = new Date()
  const endDate = new Date(startDate)

  endDate.setDate(startDate.getDate() + 6)

  const startDateISO = aISO(startDate)

  const { data: slotData, isError: isErrorSlots, error: errorSlots, refetch: refetchSlots } = useSlots({
    dni: user?.dni,
    desde: startDateISO,
    hasta: startDateISO,
  })

  const { data: turnos = [], isError: isErrorTurnos, error: errorTurnos, refetch: refetchTurnos } = useQuery({
    queryKey: ['turnos-profesional', user?.dni, startDateISO],
    queryFn: () => getTurnosByProfesional({ dni_profesional: user?.dni, desde: startDateISO }),
  })

  const isError = isErrorPerfil || isErrorSlots || isErrorTurnos
  const errorMsg = errorPerfil?.message || errorSlots?.message || errorTurnos?.message || 'Error al cargar los datos del panel'
  const refetchAll = () => {
    refetchPerfil()
    refetchSlots()
    refetchTurnos()
  }

  const turnosHoy = turnos.filter((t) => t.fecha_turno?.slice(0, 10) === startDateISO && t.estado === 'activo').length
  const estaSemana = turnos.filter((t) => t.estado === 'activo').length
  const cancelados7d = turnos.filter((t) => t.estado === 'cancelado').length
  const barData = buildBarData(turnos)
  const freeSlotsToday = slotData?.dias[0]?.slots.length ?? 0

  const turnosDeHoy = turnos
    .filter((t) => t.fecha_turno?.slice(0, 10) === startDateISO)
    .map((t) => ({
      id: t.id_turno,
      hora: t.hora_turno?.slice(0, 5),
      paciente: `${t.nombre} ${t.apellido}`,
      foto_url: t.foto_url,
      nombre: t.nombre,
      apellido: t.apellido,
      estado: t.estado,
    }))

  const minAhora = new Date().getHours() * 60 + new Date().getMinutes()
  const proximoTurno = turnos.find((t) => {
    if (t.estado !== 'activo') return false
    const fecha = t.fecha_turno?.slice(0, 10)
    if (fecha > startDateISO) return true
    if (fecha === startDateISO) {
      const [h, m] = (t.hora_turno ?? '').split(':').map(Number)
      return h * 60 + m >= minAhora
    }
    return false
  }) ?? null

  const isDesktop = useIsDesktop('sm')
  const saludo = perfil ? `Hola, ${perfil.nombre} ${perfil.apellido}` : 'Hola'

  return (
    <div style={{
      height: 'calc(100dvh - var(--app-shell-padding) * 2)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <PageHeader
        title={saludo}
        subtitle={new Date().toLocaleDateString('es-AR', {
          timeZone: 'UTC',
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}
      />

      {isError && (
        <QueryError message={errorMsg} onRetry={refetchAll} />
      )}

      {!isDesktop && (
        <Stack gap="sm" p="xs" pb="xl" style={{ flex: 1, overflowY: 'auto' }}>
          <SimpleGrid cols={2}>
            <StatCard label="Turnos hoy" value={turnosHoy} color="brand" />
            <StatCard label="Esta semana" value={estaSemana} color="accent" />
            <StatCard label="Cancelados" value={cancelados7d} color="red" />
            <StatCard label="Slots libres" value={freeSlotsToday} color="cyan" />
          </SimpleGrid>
          <ProximoTurno turno={proximoTurno} isDesktop={isDesktop} />
          <TurnosDeHoy turnos={turnosDeHoy} />
          <TurnosPorDia data={barData} />
        </Stack>
      )}

      {isDesktop && (
        <Box
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) minmax(280px, 340px)',
            gridTemplateRows: 'auto 1fr',
            gap: 8,
            minHeight: 0,
          }}
        >
          <StatCard label="Turnos hoy" value={turnosHoy} color="brand" />
          <StatCard label="Esta semana" value={estaSemana} color="accent" />
          <StatCard label="Cancelados" value={cancelados7d} color="red" />
          <StatCard label="Slots libres hoy" value={freeSlotsToday} color="cyan" />

          <TurnosDeHoy turnos={turnosDeHoy} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
            <ProximoTurno turno={proximoTurno} isDesktop={isDesktop} />
            <TurnosPorDia data={barData} />
          </div>
        </Box>
      )}
    </div>
  )
}
