import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { Schedule } from '@mantine/schedule'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import {
  IconCalendarEvent,
  IconCalendarOff,
  IconDots,
  IconFilterOff,
  IconSearch,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { PageHeader } from '../../components/PageHeader.jsx'
import QueryError from '../../components/QueryError.jsx'
import { EstadoTurnoBadge } from '../../components/EstadoTurnoBadge.jsx'
import { UserAvatar } from '../../components/UserAvatar.jsx'
import { useIsDesktop } from '../../hooks/useIsDesktop.js'
import useCambiarEstadoTurno from '../../hooks/useCambiarEstadoTurno.jsx'
import { useAhoraEnZona } from '../../hooks/useTurnosDia.jsx'
import {
  useAdminTurnos,
  useAusenteTurnoAdmin,
  useCancelarTurnoAdmin,
  useCompletarTurnoAdmin,
  useProfesionalesList,
} from '../../hooks/useAdminTurnos.jsx'
import { ESTADO_COLOR, ESTADO_LABEL, esAbierto } from '../../utils/estadosTurno.js'
import { fechaCorta, horaCorta, rangoMes } from '../../utils/fechas.utils.js'
import { ReprogramarTurnoModal } from '../turnos/ReprogramarTurnoModal.jsx'
import { TurnoHistorialModal } from '../turnos/TurnoHistorialModal.jsx'
import { AccionEstadoModal } from './turnos/AccionEstadoModal.jsx'
import { BloqueosModal } from './turnos/BloqueosModal.jsx'
import { CancelarTurnoAdminModal } from './turnos/CancelarTurnoAdminModal.jsx'
import { ReasignarTurnoModal } from './turnos/ReasignarTurnoModal.jsx'
import { TurnoCardAdmin } from './turnos/TurnoCardAdmin.jsx'
import { TurnoRowMenu } from './turnos/TurnoRowMenu.jsx'

dayjs.locale('es')

const ETIQUETAS_ES = {
  today: 'Hoy',
  next: 'Siguiente',
  previous: 'Anterior',
  more: 'Más',
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
  year: 'Año',
  allDay: 'Todo el día',
  weekday: 'Día de la semana',
  timeSlot: 'Franja horaria',
  selectMonth: 'Seleccionar mes',
  selectYear: 'Seleccionar año',
  switchToDayView: 'Cambiar a vista de día',
  switchToWeekView: 'Cambiar a vista de semana',
  switchToMonthView: 'Cambiar a vista de mes',
  switchToYearView: 'Cambiar a vista de año',
  viewSelectLabel: 'Vista del calendario',
  noEvents: 'Sin eventos',
  moreLabel: (cantidad) => `+${cantidad} más`,
  resource: 'Recurso',
  resources: 'Recursos',
  resourceSlot: 'Franja horaria del recurso',
  agenda: 'Agenda',
}

const OPCIONES_ESTADO = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(ESTADO_LABEL).map(([value, label]) => ({ value, label })),
]

const COLUMNAS = ['Fecha', 'Hora', 'Paciente', 'Profesional', 'Estado', 'Acciones']

export default function AdminTurnos() {
  const isDesktop = useIsDesktop()
  const ahora = useAhoraEnZona()

  const mesInicial = useMemo(() => rangoMes(), [])
  const [rango, setRango] = useState([mesInicial.desde, mesInicial.hasta])
  const [fechaCalendario, setFechaCalendario] = useState(new Date())
  const [estado, setEstado] = useState('')
  const [profesional, setProfesional] = useState('')
  const [clienteInput, setClienteInput] = useState('')
  const [clienteDebounced] = useDebouncedValue(clienteInput, 300)
  const [vista, setVista] = useState('tabla')

  const [bloqueosAbierto, { open: abrirBloqueos, close: cerrarBloqueos }] = useDisclosure(false)
  const [turnoACancelar, setTurnoACancelar] = useState(null)
  const [turnoAReprogramar, setTurnoAReprogramar] = useState(null)
  const [turnoAReasignar, setTurnoAReasignar] = useState(null)
  const [historialId, setHistorialId] = useState(null)
  const [accionEstado, setAccionEstado] = useState(null) // { turno, tipo: 'completado' | 'ausente' }

  const desde = rango?.[0] ? String(rango[0]).slice(0, 10) : mesInicial.desde
  const hasta = rango?.[1] ? String(rango[1]).slice(0, 10) : (rango?.[0] ? String(rango[0]).slice(0, 10) : mesInicial.hasta)

  const { data: profesionales = [] } = useProfesionalesList()
  const opcionesProfesionales = useMemo(
    () => [
      { value: '', label: 'Todos los profesionales' },
      ...profesionales.map((p) => ({
        value: String(p.dni_profesional),
        label: `${p.nombre} ${p.apellido}`,
      })),
    ],
    [profesionales],
  )

  const {
    data: turnos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminTurnos({
    desde,
    hasta,
    estado: estado || undefined,
    profesional: profesional || undefined,
    cliente: clienteDebounced.trim() || undefined,
  })

  const cambiarEstado = useCambiarEstadoTurno()
  const cancelarAdmin = useCancelarTurnoAdmin()
  const completarAdmin = useCompletarTurnoAdmin()
  const ausenteAdmin = useAusenteTurnoAdmin()

  const hayFiltrosExtras = Boolean(
    estado ||
    profesional ||
    clienteInput.trim() ||
    desde !== mesInicial.desde ||
    hasta !== mesInicial.hasta,
  )

  const limpiarFiltros = () => {
    setRango([mesInicial.desde, mesInicial.hasta])
    setFechaCalendario(new Date())
    setEstado('')
    setProfesional('')
    setClienteInput('')
  }

  const handleConfirmar = (turno) => {
    cambiarEstado.mutate({ id: turno.id_turno, estado: 'confirmado' })
  }

  const handleMarcarEnEspera = (turno) => {
    cambiarEstado.mutate({ id: turno.id_turno, estado: 'en_espera' })
  }

  const handleConfirmarCancelacion = (motivo, onReset) => {
    if (!turnoACancelar) return
    cancelarAdmin.mutate(
      { id: turnoACancelar.id_turno, motivo },
      {
        onSuccess: () => {
          onReset?.()
          setTurnoACancelar(null)
        },
      },
    )
  }

  const handleConfirmarEstadoAdmin = (motivo, onReset) => {
    if (!accionEstado) return
    const { turno, tipo } = accionEstado
    const mutacion = tipo === 'ausente' ? ausenteAdmin : completarAdmin
    mutacion.mutate(
      { id: turno.id_turno, motivo },
      {
        onSuccess: () => {
          onReset?.()
          setAccionEstado(null)
        },
      },
    )
  }

  const eventosCalendario = useMemo(
    () =>
      turnos.map((t) => {
        const fechaISO = String(t.fecha_turno).slice(0, 10)
        const horaStr = String(t.hora_turno).slice(0, 5)
        const start = new Date(`${fechaISO}T${t.hora_turno}`)
        const duracionMin = Number(t.duracion_turno_min) || 30
        const end = new Date(start.getTime() + duracionMin * 60 * 1000)
        const nombreCliente = `${t.c_nombre ?? t.nombre ?? ''} ${t.c_apellido ?? t.apellido ?? ''}`.trim()
        const colorBase = t.estado === 'confirmado' ? 'blue' : (ESTADO_COLOR[t.estado] ?? 'blue')

        return {
          id: t.id_turno,
          title: `${horaStr} ${nombreCliente}`,
          start,
          end,
          color: colorBase,
          payload: t,
        }
      }),
    [turnos],
  )

  const handleFechaCalendarioChange = (nuevaFecha) => {
    setFechaCalendario(nuevaFecha)
    const nuevoMes = rangoMes(nuevaFecha)
    setRango([nuevoMes.desde, nuevoMes.hasta])
  }

  const handleDiaClick = (dia) => {
    const fechaISO = dayjs(dia).format('YYYY-MM-DD')
    setRango([fechaISO, fechaISO])
    setVista('tabla')
  }

  return (
    <Stack gap="lg">
      <PageHeader
        title="Turnos"
        subtitle="Monitor global de turnos del centro."
      />

      <Paper withBorder p="md" radius="lg">
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
            <DatePickerInput
              type="range"
              label="Período"
              placeholder="Desde — Hasta"
              locale="es"
              valueFormat="DD/MM/YY"
              allowSingleDateInRange
              leftSection={<IconCalendarEvent size={16} />}
              value={rango}
              onChange={(val) => {
                setRango(val ?? [null, null])
                if (val?.[0]) {
                  const [y, m, d] = String(val[0]).slice(0, 10).split('-').map(Number)
                  if (y && m && d) setFechaCalendario(new Date(y, m - 1, d))
                }
              }}
            />

            <Select
              label="Estado"
              data={OPCIONES_ESTADO}
              value={estado}
              onChange={(val) => setEstado(val ?? '')}
              allowDeselect={false}
            />

            <Select
              label="Profesional"
              data={opcionesProfesionales}
              searchable
              nothingFoundMessage="Sin coincidencias"
              value={profesional}
              onChange={(val) => setProfesional(val ?? '')}
              allowDeselect={false}
            />

            <TextInput
              label="Cliente"
              placeholder="Nombre o DNI…"
              leftSection={<IconSearch size={16} />}
              value={clienteInput}
              onChange={(e) => setClienteInput(e.currentTarget.value)}
            />
          </SimpleGrid>

          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Group gap="sm" wrap="wrap">
              <SegmentedControl
                value={vista}
                onChange={(val) => {
                  setVista(val)
                  if (val === 'calendario' && desde === hasta) {
                    const mes = rangoMes(fechaCalendario)
                    setRango([mes.desde, mes.hasta])
                  }
                }}
                data={[
                  { value: 'tabla', label: 'Tabla' },
                  { value: 'calendario', label: 'Calendario' },
                ]}
              />

              {hayFiltrosExtras && (
                <Button
                  variant="default"
                  leftSection={<IconFilterOff size={16} />}
                  onClick={limpiarFiltros}
                >
                  Limpiar
                </Button>
              )}
            </Group>

            <Button
              variant="default"
              leftSection={<IconCalendarOff size={16} />}
              onClick={abrirBloqueos}
            >
              Bloqueos de agenda
            </Button>
          </Group>
        </Stack>
      </Paper>

      {isLoading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {isError && (
        <QueryError
          message={error?.message || 'No se pudieron cargar los turnos del centro'}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && vista === 'calendario' && (
        <Paper withBorder p="md" radius="lg">
          <Schedule
            date={fechaCalendario}
            onDateChange={handleFechaCalendarioChange}
            onDayClick={handleDiaClick}
            view="month"
            locale="es"
            labels={ETIQUETAS_ES}
            monthViewProps={{
              withOutsideDays: false,
              viewSelectProps: { views: ['month'] },
            }}
            events={eventosCalendario}
          />
        </Paper>
      )}

      {!isLoading && !isError && vista === 'tabla' && turnos.length === 0 && (
        <Paper withBorder p="xl" radius="lg">
          <Stack align="center" gap="sm" py="md">
            <IconCalendarOff size={48} color="var(--mantine-color-dimmed)" />
            <Text fw={600}>No hay turnos en el período.</Text>
            {hayFiltrosExtras && (
              <Button variant="default" size="xs" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      {!isLoading && !isError && vista === 'tabla' && turnos.length > 0 && (
        isDesktop ? (
          <Paper withBorder radius="lg" p="md">
            <Table.ScrollContainer minWidth={820}>
              <Table verticalSpacing="md" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    {COLUMNAS.map((col) => (
                      <Table.Th key={col} style={col === 'Acciones' ? { width: 56 } : undefined}>
                        <Text fz="xs" fw={700} tt="uppercase" c="dimmed">{col}</Text>
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {turnos.map((turno) => {
                    const nombreCliente = `${turno.c_nombre ?? turno.nombre ?? ''} ${turno.c_apellido ?? turno.apellido ?? ''}`.trim()
                    const nombreProfesional = `${turno.p_nombre ?? ''} ${turno.p_apellido ?? ''}`.trim()
                    const abierto = esAbierto(turno.estado)

                    return (
                      <Table.Tr key={turno.id_turno}>
                        <Table.Td>
                          <Text fz="sm" fw={500}>{fechaCorta(turno.fecha_turno)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="sm">{horaCorta(turno.hora_turno)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="sm" wrap="nowrap">
                            <UserAvatar
                              size={32}
                              radius="100%"
                              withLink={false}
                              src={turno.c_foto_url ?? turno.foto_url}
                              name={nombreCliente}
                            />
                            <Text fz="sm" fw={500} lineClamp={1}>{nombreCliente}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="sm" wrap="nowrap">
                            <UserAvatar
                              size={32}
                              radius="100%"
                              withLink={false}
                              src={turno.p_foto_url}
                              name={nombreProfesional}
                            />
                            <Text fz="sm" fw={500} lineClamp={1}>{nombreProfesional}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <EstadoTurnoBadge estado={turno.estado} />
                        </Table.Td>
                        <Table.Td>
                          {abierto ? (
                            <TurnoRowMenu
                              turno={turno}
                              ahora={ahora}
                              cambiandoEstado={cambiarEstado.isPending}
                              onConfirmar={handleConfirmar}
                              onMarcarEnEspera={handleMarcarEnEspera}
                              onReprogramar={setTurnoAReprogramar}
                              onVerHistorial={(t) => setHistorialId(t.id_turno)}
                              onReasignar={setTurnoAReasignar}
                              onCompletar={(t) => setAccionEstado({ turno: t, tipo: 'completado' })}
                              onMarcarAusente={(t) => setAccionEstado({ turno: t, tipo: 'ausente' })}
                              onCancelar={setTurnoACancelar}
                              target={
                                <ActionIcon
                                  variant="subtle"
                                  color="gray"
                                  aria-label="Acciones del turno"
                                >
                                  <IconDots size={16} />
                                </ActionIcon>
                              }
                            />
                          ) : (
                            <Text c="dimmed" fz="sm">—</Text>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        ) : (
          <Stack gap="sm">
            {turnos.map((turno) => (
              <TurnoCardAdmin
                key={turno.id_turno}
                turno={turno}
                ahora={ahora}
                cambiandoEstado={cambiarEstado.isPending}
                onConfirmar={handleConfirmar}
                onMarcarEnEspera={handleMarcarEnEspera}
                onReprogramar={setTurnoAReprogramar}
                onVerHistorial={(t) => setHistorialId(t.id_turno)}
                onReasignar={setTurnoAReasignar}
                onCompletar={(t) => setAccionEstado({ turno: t, tipo: 'completado' })}
                onMarcarAusente={(t) => setAccionEstado({ turno: t, tipo: 'ausente' })}
                onCancelar={setTurnoACancelar}
              />
            ))}
          </Stack>
        )
      )}

      <CancelarTurnoAdminModal
        opened={Boolean(turnoACancelar)}
        onClose={() => !cancelarAdmin.isPending && setTurnoACancelar(null)}
        onConfirm={handleConfirmarCancelacion}
        turno={turnoACancelar}
        isPending={cancelarAdmin.isPending}
      />

      <ReprogramarTurnoModal
        opened={Boolean(turnoAReprogramar)}
        onClose={() => setTurnoAReprogramar(null)}
        turno={turnoAReprogramar}
        dniProfesional={turnoAReprogramar?.dni_profesional}
        ahora={ahora}
      />

      <TurnoHistorialModal
        opened={historialId !== null}
        onClose={() => setHistorialId(null)}
        turnoId={historialId}
      />

      <ReasignarTurnoModal
        opened={Boolean(turnoAReasignar)}
        onClose={() => setTurnoAReasignar(null)}
        turno={turnoAReasignar}
        profesionales={profesionales}
      />

      <AccionEstadoModal
        opened={Boolean(accionEstado)}
        onClose={() => !completarAdmin.isPending && !ausenteAdmin.isPending && setAccionEstado(null)}
        onConfirm={handleConfirmarEstadoAdmin}
        turno={accionEstado?.turno}
        tipo={accionEstado?.tipo}
        isPending={completarAdmin.isPending || ausenteAdmin.isPending}
      />

      <BloqueosModal
        opened={bloqueosAbierto}
        onClose={cerrarBloqueos}
        desde={desde}
        hasta={hasta}
        profesionales={profesionales}
      />
    </Stack>
  )
}
