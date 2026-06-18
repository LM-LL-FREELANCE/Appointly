import { useState } from 'react'
import {
  Grid, Card, Stack, Group, Text,
  Select, Button, TextInput, SegmentedControl, Title, Center, Loader, Avatar
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { PageHeader } from '../components/PageHeader'
import { DoctorCard } from '../components/DoctorCard'
import DoctorTable from '../components/DoctorTable'
import { getFilteredProfesional, getAllEspecialidades, getAllObraSociales } from '../services/profesionales'
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { Link } from 'react-router-dom'

export default function Buscar() {
  const [busqueda, setBusqueda] = useState('')
  const [especialidad, setEspecialidad] = useState(null)
  const [obraSocial, setObraSocial] = useState(null)
  const [vista, setVista] = useState('cards')

  const { data: profesionales = [], isLoading: isLoadingProfesionales } = useQuery({
    queryKey: ["profesionales", especialidad, obraSocial],
    queryFn: () => getFilteredProfesional({ especialidad, obraSocial }),
    placeholderData: keepPreviousData,
  })

  const { data: especialidades = [], isLoading: isLoadingEspecialidades } = useQuery({
    queryKey: ["especialidades"],
    queryFn: getAllEspecialidades,
  })

  const { data: obraSociales = [], isLoading: isLoadingObraSociales } = useQuery({
    queryKey: ["obrasociales"],
    queryFn: getAllObraSociales,
  })

  const doctoresFiltrados = profesionales.filter(doc =>
    `${doc.nombre} ${doc.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
  )
  const isLoadingAll = isLoadingProfesionales && isLoadingEspecialidades && isLoadingObraSociales

  if (isLoadingAll) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    )
  }
  return (
    <Stack gap="md">
      <PageHeader>
        <Group justify="space-between" style={{ flex: 1 }}>
          <Title order={4}>Buscar doctores</Title>
          <Group>
            <TextInput
              placeholder="Buscar por nombre..."
              leftSection={<IconSearch size={16} />}
              value={busqueda}
              onChange={(e) => setBusqueda(e.currentTarget.value)}
              w={{ base: '100%', sm: 240 }}
            />
            <Avatar radius="xl" alt="" component={Link} to="/user" />
          </Group>
        </Group>
      </PageHeader>



      <Grid gutter={{ base: 'sm', md: 'md' }}>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder padding="md" radius="md">
            <Stack gap="md">
              <Title order={5}>Filtros</Title>

              <Select
                label="Especialidad"
                placeholder="Todas"
                clearable
                data={especialidades.map(esp => ({ value: String(esp.id), label: esp.especialidad }))}
                value={especialidad}
                onChange={setEspecialidad}
              />

              <Select
                label="Obra social"
                placeholder="Todas"
                clearable
                data={obraSociales.map(os => ({ value: String(os.id), label: os.obra_social }))}
                value={obraSocial}
                onChange={setObraSocial}
              />

              <Button
                variant="outline"
                color="gray"
                fullWidth
                onClick={() => {
                  setBusqueda('')
                  setEspecialidad(null)
                  setObraSocial(null)
                }}
              >
                Limpiar filtros
              </Button>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 9 }}>
          <Stack gap="md">
            <Group justify="space-between" align="center" wrap="wrap" gap="xs">
              <Text size="sm" c="orange">
                Mostrando {doctoresFiltrados.length} de {profesionales.length} profesionales
              </Text>
              <SegmentedControl
                value={vista}
                onChange={setVista}
                data={[
                  { label: 'Cards', value: 'cards' },
                  { label: 'Lista', value: 'lista' },
                ]}
              />
            </Group>
            {vista === 'cards' ? (
              isLoadingProfesionales ? (
                <Center h={200}>
                  <Loader />
                </Center>
              ) : doctoresFiltrados.length === 0 ? (
                <Text c="dimmed" ta="center" mt="xl">
                  No se encontraron profesionales con esos filtros.
                </Text>
              ) : (
                doctoresFiltrados.map(doc => (
                  <DoctorCard
                    keyDoctor={doc.dni_profesional}
                    doctor={doc}
                    onVerDisponibilidad={(d) => console.log('Ver disponibilidad:', d.nombre)}
                  />
                ))
              )
            ) : (
              <DoctorTable profesionales={doctoresFiltrados} />
            )}

          </Stack>
        </Grid.Col>
      </Grid>
    </Stack >
  )
}