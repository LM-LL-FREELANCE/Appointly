import { Paper, Text, Grid } from '@mantine/core'
import { PageHeader } from '../components/PageHeader.jsx'
import useProfesionalDays from '../hooks/useProfesionalDays.jsx'
import { useState } from 'react'
import { rangoMes, rangoSemana } from '../utils/fechas.utils.js'
//ui
import { MonthView } from '@mantine/schedule'

export default function Agenda() {
  const [profesional, setProfesional] = useState(27845123)
  const [estado, setEstado] = useState(null)
  const [fecha, setFecha] = useState(new Date())
  const [mes, setMes] = useState(true)
  const { desde, hasta } = mes ? rangoMes(fecha) : rangoSemana(fecha)
  const { data: profesionalAgenda, isLoading, error } = useProfesionalDays({ dni_profesional: profesional, desde, hasta })
  console.log(profesionalAgenda)
  return (
    <>
      <PageHeader>
        <Text fw={600} size="lg">Agenda</Text>
      </PageHeader>
      <Paper>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper withBorder p="md" radius="md">
              <MonthView
                date={new Date()}
                events={(profesionalAgenda ?? []).map(t => ({
                  ...t,
                  id: t.id_turno,
                  date: new Date(`${t.fecha_turno}T${t.hora_turno}:00`),
                }))}
                withOutsideDays={false}
              />
            </Paper>
          </Grid.Col>
        </Grid>
      </Paper>
    </>
  )
}
