import { useState } from 'react'
import {
  Grid, Card, Stack, Group, Text,
  Select, Button, TextInput, SegmentedControl, Title, Center, Loader,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { PageHeader } from '../components/PageHeader'
import { DoctorCard } from '../components/DoctorCard'
import DoctorTable from '../components/DoctorTable'
import { getFilteredProfesional, getAllEspecialidades } from '../api/profesionales.js'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import useObrasSociales from '../hooks/useObraSociales'
import { useIsDesktop } from '../hooks/useIsDesktop.js'
import QueryError from '../components/QueryError.jsx'

export default function Buscar() {
  const navigate = useNavigate()
  const isDesktop = useIsDesktop('sm')
  const [busqueda, setBusqueda] = useState('')
  const [especialidad, setEspecialidad] = useState(null)
  const [obraSocial, setObraSocial] = useState(null)
  const [vista, setVista] = useState('cards')

  const { data: profesionales = [], isLoading: isLoadingProfesionales, isError: isErrorProfessionals, refetch: refetchProfesionals } = useQuery({
    queryKey: ['profesionales', especialidad, obraSocial],
    queryFn: () => getFilteredProfesional({ especialidad, obraSocial }),
    placeholderData: keepPreviousData,
  })

  const { data: especialidades = [], isLoading: isLoadingEspecialidades, isError: isErrorEspecialidades, refetch: refetchEspecialidades } = useQuery({
    queryKey: ['especialidades'],
    queryFn: getAllEspecialidades,
  })

  const { data: obraSociales = [], isLoading: isLoadingObraSociales, isError: isErrorObras, refetch: refetchObras } = useObrasSociales()

  const doctoresFiltrados = profesionales.filter((doc) =>
    `${doc.nombre} ${doc.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
  )
  const isLoadingAll = isLoadingProfesionales && isLoadingEspecialidades && isLoadingObraSociales
  const isError = isErrorEspecialidades || isErrorProfessionals || isErrorObras
  const refetchAll = () => {
    refetchProfesionals()
    refetchEspecialidades()
    refetchObras()
  }

  if (isLoadingAll) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    )
  }

  return (
    <Stack gap="md">
      <PageHeader
        title="Buscar doctores"
        actions={isDesktop && (
          <TextInput
            placeholder="Buscar por nombre..."
            leftSection={<IconSearch size={16} />}
            value={busqueda}
            onChange={(e) => setBusqueda(e.currentTarget.value)}
            w={240}
          />
        )}
      />
      {isError && (
        <QueryError message="No se puedieron cargar todos los datos" onRetry={refetchAll} />
      )}
      {!isDesktop && (
        <TextInput
          placeholder="Buscar por nombre..."
          leftSection={<IconSearch size={16} />}
          value={busqueda}
          onChange={(e) => setBusqueda(e.currentTarget.value)}
        />
      )}

      <Grid gutter={{ base: 'sm', md: 'md' }}>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder padding="md" radius="md">
            <Stack gap="md">
              <Title order={5}>Filtros</Title>

              <Select
                label="Especialidad"
                placeholder="Todas"
                clearable
                data={especialidades.map((esp) => ({ value: String(esp.id), label: esp.especialidad }))}
                value={especialidad}
                onChange={setEspecialidad}
              />

              <Select
                label="Obra social"
                placeholder="Todas"
                clearable
                data={obraSociales.map((os) => ({ value: String(os.id), label: os.obra_social }))}
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
              {isDesktop && (
                <SegmentedControl
                  value={vista}
                  onChange={setVista}
                  data={[
                    { label: 'Cards', value: 'cards' },
                    { label: 'Lista', value: 'lista' },
                  ]}
                />
              )}
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
                doctoresFiltrados.map((doc) => (
                  <DoctorCard
                    key={doc.dni_profesional}
                    doctor={doc}
                    onVerDisponibilidad={(d) => navigate('/reservar', { state: { doctor: d } })}
                  />
                ))
              )
            ) : (
              <DoctorTable
                profesionales={doctoresFiltrados}
                onVerDisponibilidad={(d) => navigate('/reservar', { state: { doctor: d } })}
              />
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
