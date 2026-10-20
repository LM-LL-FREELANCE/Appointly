import { useMemo, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Center,
  ColorSwatch,
  Divider,
  Grid,
  Group,
  Loader,
  Menu,
  Paper,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { AreaChart, BarChart, DonutChart } from '@mantine/charts'
import { DatePickerInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import {
  IconCalendarCheck,
  IconCalendarMonth,
  IconChartBar,
  IconChartPie,
  IconChevronDown,
  IconCircleCheck,
  IconFileDownload,
  IconFileSpreadsheet,
  IconStethoscope,
  IconTrendingUp,
  IconUsers,
  IconUserX,
  IconX,
} from '@tabler/icons-react'
import 'dayjs/locale/es'
import { PageHeader } from '../../components/PageHeader.jsx'
import QueryError from '../../components/QueryError.jsx'
import { UserAvatar } from '../../components/UserAvatar.jsx'
import { descargarCSV } from '../../api/descargas.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useAdminMetricas } from '../../hooks/useAdminMetricas.jsx'
import { ESTADO_COLOR, ESTADO_LABEL } from '../../utils/estadosTurno.js'
import { fechaCorta, rangoMes } from '../../utils/fechas.utils.js'
import { KpiCard } from './inicio/KpiCard.jsx'

function SectionHeader({ icon, title }) {
  return (
    <>
      <Group gap="xs" align="center">
        <ThemeIcon variant="light" color="brand" size="sm" radius="md">
          {icon}
        </ThemeIcon>
        <Text fw={700} fz="md">{title}</Text>
      </Group>
      <Divider my="sm" />
    </>
  )
}

const EMPTY_OBJ = {}
const EMPTY_ARR = []

export default function AdminInicio() {
  const { user } = useAuth()
  const mesInicial = useMemo(() => rangoMes(), [])
  const [rango, setRango] = useState([mesInicial.desde, mesInicial.hasta])
  const [descargando, setDescargando] = useState(null) // 'turnos' | 'usuarios' | null

  const desde = rango?.[0] ? String(rango[0]).slice(0, 10) : mesInicial.desde
  const hasta = rango?.[1]
    ? String(rango[1]).slice(0, 10)
    : (rango?.[0] ? String(rango[0]).slice(0, 10) : mesInicial.hasta)

  const { data, isLoading, isError, error, refetch } = useAdminMetricas(desde, hasta)

  const turnosHoy = data?.turnos_hoy ?? 0
  const turnosRango = data?.turnos_rango ?? 0
  const tasas = data?.tasas ?? { completitud: 0, cancelacion: 0, ausentismo: 0 }
  const porEstado = data?.por_estado ?? EMPTY_OBJ
  const especialidadesTop = data?.especialidades_top ?? EMPTY_ARR
  const profesionalesTop = data?.profesionales_top ?? EMPTY_ARR
  const horasPico = data?.horas_pico ?? EMPTY_ARR
  const nuevosClientes = data?.nuevos_clientes ?? EMPTY_ARR

  const donutData = useMemo(() => {
    return Object.entries(ESTADO_LABEL)
      .map(([estado, label]) => ({
        estado,
        name: label,
        value: Number(porEstado[estado] ?? 0),
        color: `${ESTADO_COLOR[estado] ?? 'gray'}.6`,
        swatchColor: `var(--mantine-color-${ESTADO_COLOR[estado] ?? 'gray'}-6)`,
      }))
      .filter((item) => item.value > 0)
  }, [porEstado])

  const maxEspecialidad = useMemo(
    () => Math.max(1, ...especialidadesTop.map((e) => e.total)),
    [especialidadesTop],
  )

  const tieneNuevosClientes = useMemo(
    () => nuevosClientes.some((c) => c.total > 0),
    [nuevosClientes],
  )

  const handleExportarTurnos = async () => {
    if (descargando) return
    setDescargando('turnos')
    try {
      const qs = new URLSearchParams({ desde, hasta }).toString()
      await descargarCSV(`/api/admin/reportes/turnos.csv?${qs}`, `turnos_${desde}_${hasta}.csv`)
    } catch (err) {
      notifications.show({
        title: 'No se pudo exportar el archivo',
        message: err?.message || 'Ocurrió un error al descargar el CSV de turnos.',
        position: 'top-right',
        icon: <IconX size={16} />,
        color: 'red',
      })
    } finally {
      setDescargando(null)
    }
  }

  const handleExportarUsuarios = async () => {
    if (descargando) return
    setDescargando('usuarios')
    try {
      await descargarCSV('/api/admin/reportes/usuarios.csv', 'usuarios.csv')
    } catch (err) {
      notifications.show({
        title: 'No se pudo exportar el archivo',
        message: err?.message || 'Ocurrió un error al descargar el CSV de usuarios.',
        position: 'top-right',
        icon: <IconX size={16} />,
        color: 'red',
      })
    } finally {
      setDescargando(null)
    }
  }

  const saludo = user?.nombre
    ? `Hola ${user.nombre}, este es el resumen del centro.`
    : 'Resumen general de la actividad del centro.'

  return (
    <Stack gap="lg">
      <PageHeader title="Inicio" subtitle={saludo} />

      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <DatePickerInput
          type="range"
          label="Período de análisis"
          placeholder="Desde — Hasta"
          locale="es"
          valueFormat="DD/MM/YY"
          allowSingleDateInRange
          leftSection={<IconCalendarMonth size={16} />}
          value={rango}
          onChange={(val) => setRango(val ?? [null, null])}
          w={{ base: '100%', xs: 280 }}
        />

        <Menu shadow="md" position="bottom-end" withinPortal>
          <Menu.Target>
            <Button
              variant="default"
              leftSection={<IconFileSpreadsheet size={16} />}
              rightSection={<IconChevronDown size={14} />}
              loading={Boolean(descargando)}
            >
              Exportar
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconFileSpreadsheet size={16} />}
              disabled={Boolean(descargando)}
              onClick={handleExportarTurnos}
            >
              Turnos del período (CSV)
            </Menu.Item>
            <Menu.Item
              leftSection={<IconFileDownload size={16} />}
              disabled={Boolean(descargando)}
              onClick={handleExportarUsuarios}
            >
              Usuarios (CSV)
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {isError && (
        <QueryError
          message={error?.message || 'No se pudieron cargar las métricas del panel'}
          onRetry={refetch}
        />
      )}

      {isLoading && !data ? (
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} height={132} radius="lg" />
          ))}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          <KpiCard
            icon={<IconCalendarCheck size={16} />}
            label="Turnos hoy"
            value={turnosHoy}
            caption="Programados para hoy"
            color="brand"
          />
          <KpiCard
            icon={<IconCalendarMonth size={16} />}
            label="Turnos del período"
            value={turnosRango}
            caption={`${fechaCorta(desde)} — ${fechaCorta(hasta)}`}
            color="cyan"
          />
          <KpiCard
            icon={<IconCircleCheck size={16} />}
            label="Completitud"
            value={`${tasas.completitud}%`}
            caption={`de ${turnosRango} turnos`}
            color="green"
          />
          <KpiCard
            icon={<IconUserX size={16} />}
            label="Ausentismo"
            value={`${tasas.ausentismo}%`}
            caption={`de ${turnosRango} turnos`}
            color="orange"
          />
        </SimpleGrid>
      )}

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder radius="lg" p="lg" h="100%">
            <SectionHeader icon={<IconChartPie size={14} />} title="Turnos por estado" />
            {isLoading && !data ? (
              <Center h={220}><Loader size="sm" /></Center>
            ) : turnosRango === 0 ? (
              <Center h={220}>
                <Text c="dimmed" fz="sm">Sin datos en el período.</Text>
              </Center>
            ) : (
              <Stack gap="md">
                <Group justify="center" align="center" gap="xl" wrap="wrap">
                  <DonutChart
                    data={donutData}
                    size={168}
                    thickness={24}
                    withLabelsLine={false}
                    withLabels={false}
                  />
                  <Stack gap={6}>
                    {donutData.map((item) => (
                      <Group key={item.estado} gap="xs" wrap="nowrap">
                        <ColorSwatch color={item.swatchColor} size={12} />
                        <Text fz="xs" c="dimmed">{item.name}:</Text>
                        <Text fz="xs" fw={600}>{item.value}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Group>
                <Text fz="xs" c="dimmed" ta="center">
                  Tasa de cancelación: {tasas.cancelacion}%
                </Text>
              </Stack>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder radius="lg" p="lg" h="100%">
            <SectionHeader icon={<IconChartBar size={14} />} title="Horas pico" />
            {isLoading && !data ? (
              <Center h={220}><Loader size="sm" /></Center>
            ) : horasPico.length === 0 ? (
              <Center h={220}>
                <Text c="dimmed" fz="sm">Sin datos en el período.</Text>
              </Center>
            ) : (
              <Box h={220}>
                <BarChart
                  h={220}
                  data={horasPico}
                  dataKey="hora"
                  series={[{ name: 'total', label: 'Turnos', color: 'brand.6' }]}
                  tickLine="none"
                  gridAxis="y"
                  withLegend={false}
                  barProps={{ radius: 4 }}
                />
              </Box>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder radius="lg" p="lg" h="100%">
            <SectionHeader
              icon={<IconTrendingUp size={14} />}
              title="Nuevos clientes (últimos 6 meses)"
            />
            {isLoading && !data ? (
              <Center h={220}><Loader size="sm" /></Center>
            ) : !tieneNuevosClientes ? (
              <Center h={220}>
                <Text c="dimmed" fz="sm">Sin datos en el período.</Text>
              </Center>
            ) : (
              <Box h={220}>
                <AreaChart
                  h={220}
                  data={nuevosClientes}
                  dataKey="periodo"
                  series={[{ name: 'total', label: 'Altas', color: 'accent.6' }]}
                  curveType="monotone"
                  tickLine="none"
                  gridAxis="y"
                  withLegend={false}
                />
              </Box>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder radius="lg" p="lg" h="100%">
            <SectionHeader icon={<IconStethoscope size={14} />} title="Top especialidades" />
            {isLoading && !data ? (
              <Center h={220}><Loader size="sm" /></Center>
            ) : especialidadesTop.length === 0 ? (
              <Center h={220}>
                <Text c="dimmed" fz="sm">Sin datos en el período.</Text>
              </Center>
            ) : (
              <Stack gap="sm" py="xs">
                {especialidadesTop.map((esp) => (
                  <Group key={esp.id} justify="space-between" align="center" wrap="nowrap" gap="md">
                    <Text fz="sm" fw={500} lineClamp={1} style={{ flex: 1 }}>
                      {esp.tipo}
                    </Text>
                    <Progress
                      value={(esp.total / maxEspecialidad) * 100}
                      color="brand.6"
                      size="md"
                      radius="xl"
                      w={140}
                    />
                    <Text fz="sm" fw={600} w={32} ta="right">
                      {esp.total}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={12}>
          <Paper withBorder radius="lg" p="lg">
            <SectionHeader icon={<IconUsers size={14} />} title="Top profesionales" />
            {isLoading && !data ? (
              <Center h={120}><Loader size="sm" /></Center>
            ) : profesionalesTop.length === 0 ? (
              <Center h={120}>
                <Text c="dimmed" fz="sm">Sin datos en el período.</Text>
              </Center>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                {profesionalesTop.map((prof) => {
                  const nombreCompleto = `${prof.nombre} ${prof.apellido}`.trim()
                  return (
                    <Paper key={prof.dni} withBorder p="sm" radius="md">
                      <Group justify="space-between" align="center" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                          <UserAvatar
                            size={32}
                            radius="100%"
                            withLink={false}
                            src={prof.foto_url}
                            name={nombreCompleto}
                          />
                          <Text fz="sm" fw={500} lineClamp={1}>
                            {nombreCompleto}
                          </Text>
                        </Group>
                        <Badge variant="light" color="brand">
                          {prof.total} {prof.total === 1 ? 'turno' : 'turnos'}
                        </Badge>
                      </Group>
                    </Paper>
                  )
                })}
              </SimpleGrid>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
