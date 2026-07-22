import useProfesionalDays from '../hooks/useProfesionalDays.jsx'
import { useState } from 'react'
import { rangoMes, rangoSemana } from '../utils/fechas.utils.js'
//react-router
import { Link, useNavigate } from 'react-router-dom'
//ui
import { Schedule } from '@mantine/schedule'
import { Paper, Text, Alert, Grid, Avatar, Group, Center, Loader, Button, Stack } from '@mantine/core'
import { PageHeader } from '../components/PageHeader.jsx'
import { useAuth } from '../hooks/useAuth.js'
import dayjs from 'dayjs'
import 'dayjs/locale/es'


dayjs.locale('es')

// Etiquetas del Schedule en español (los textos de la UI vienen en inglés por defecto)
const etiquetasEs = {
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

export default function Agenda() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [estado, setEstado] = useState(null)
  const [fecha, setFecha] = useState(new Date())
  const [vista, setVista] = useState('month')
  const esMes = vista === 'month'
  const { desde, hasta } = esMes ? rangoMes(fecha) : rangoSemana(fecha)
  const { data: profesionalAgenda, isLoading: isLoadingData, error } = useProfesionalDays({ dni_profesional: user?.dni, desde, hasta, estado })

  const eventos = (profesionalAgenda ?? []).map((t) => {
    // fecha_turno viene como ISO completo ("2026-07-03T03:00:00.000Z"),
    // nos quedamos solo con la parte de la fecha. hora_turno ya trae segundos.
    const fechaISO = t.fecha_turno.slice(0, 10)
    const start = new Date(`${fechaISO}T${t.hora_turno}`)
    const end = new Date(start.getTime() + 30 * 60 * 1000) // dura 30 min
    return {
      id: t.id_turno,
      title: `${t.nombre} ${t.apellido}`,
      start,
      end,
      color: t.estado === 'cancelado' ? 'red' : 'blue',
      payload: t,
    }
  })
  const fechaSel = dayjs(fecha).format('YYYY-MM-DD')
  const turnosDelDia = (profesionalAgenda ?? []).filter(t => t.fecha_turno.slice(0, 10) === fechaSel)
  if (isLoadingData) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    )
  }
  return (
    <>
      <PageHeader>
        <Group justify="space-between" style={{ flex: 1 }}>
          <Text fw={600} size="lg">Agenda</Text>
          <Avatar radius="xl" alt="" component={Link} to="/miperfil" />
        </Group>
      </PageHeader>
      {error && (
        <Alert color="red">
          Error al cargar los datos de la agenda
        </Alert>
      )}
      {(!isLoadingData && !error) && (
        <Paper>
          <Grid mah={900}>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Paper withBorder p="md" radius="md">
                <Schedule
                  date={fecha}
                  onDateChange={setFecha}
                  onDayClick={(dia) => {

                    if (dayjs(dia).isBefore(dayjs(), 'day')) return
                    setFecha(dia)
                  }}
                  view={vista}
                  onViewChange={setVista}
                  locale="es"
                  labels={etiquetasEs}
                  monthViewProps={{
                    withOutsideDays: false,
                    viewSelectProps: { views: ['month'] },
                    highlightToday: false,
                    getDayProps: (dia) => {
                      const esPasado = dayjs(dia).isBefore(dayjs(), 'day')
                      const esSeleccionado = dayjs(dia).isSame(dayjs(fecha), 'day')
                      return {
                        disabled: esPasado,
                        className: esPasado ? 'dia-pasado' : esSeleccionado ? 'dia-seleccionado' : undefined
                      }
                    }
                  }}
                  events={eventos}
                />
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper withBorder p="md" radius="md">
                <Stack gap="sm" style={{ overflowY: 'auto' }}>
                  <Schedule
                    date={fecha}
                    onDateChange={setFecha}
                    locale="es"
                    labels={etiquetasEs}
                    view={"day"}
                    onViewChange={setVista}
                    dayViewProps={{
                      scrollAreaProps: { mah: 450 },
                      startTime: '08:00:00',
                      endTime: '23:00:00',
                      intervalMinutes: 30,
                      viewSelectProps: { views: ['day'] },
                      // deshabilita la flecha "atrás" si ya estamos en hoy o antes
                      previousControlProps: {
                        disabled: !dayjs(fecha).isAfter(dayjs(), 'day')
                      }
                    }}
                    events={eventos}
                  />
                  <Button onClick={() => navigate('/turnos', {
                    state: { turnos: turnosDelDia, fecha: fechaSel, dni_profesional: user?.dni },
                  })}>Detalles de los turnos del dia</Button>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>
      )}
    </>
  )
}
