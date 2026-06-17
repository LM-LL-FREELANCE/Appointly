import { useState } from 'react'
import {
    Grid, Card, Stack, Group, Text, Checkbox,
    Select, Button, TextInput, SegmentedControl, Title
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { PageHeader } from '../components/PageHeader'
import { DoctorCard } from '../components/DoctorCard'
import Especialidad from '../components/Especialidad'
import { getAllProfesionales, getAllEspecialidades, getAllObraSociales, getProfesionalByDni, getFilteredProfesional } from '../services/profesionales'
import { useQuery } from "@tanstack/react-query"

export default function Buscar() {
    const [busqueda, setBusqueda] = useState('')
    const [especialidadesClick, setEspecialidadesClick] = useState([])
    const [obraSocial, setObraSocial] = useState(null)
    const [vista, setVista] = useState('cards')

    const { data: profesionales, isLoading: isLoadingProfesionales, isError: isErrorProfesionales, error: errorProfesionales } = useQuery({
        queryKey: ["profesionales", "todos"],
        queryFn: getAllProfesionales,
    })
    const { data: especialidades, isLoading: isLoadingEspecialidades, isError: isErrorEspecialidad, error: errorEspecialidad } = useQuery({
        queryKey: ["especialidades"],
        queryFn: getAllEspecialidades,
    })
    const { data: obraSociales, isLoading: isLoadingObrasociales, isError: isErrorObraSocial, error: errorObraSociales } = useQuery({
        queryKey: ["obrasociales"],
        queryFn: getAllObraSociales,
    })

    const doctoresFiltrados = mockDoctores.filter(doc => {
        const matchNombre = doc.nombre.toLowerCase().includes(busqueda.toLowerCase())
        const matchEsp = especialidades.length === 0 ||
            especialidades.some(e => doc.especialidad.toLowerCase().includes(e))
        const matchOS = !obraSocial || doc.obrasSociales.includes(obraSocial)
        return matchNombre && matchEsp && matchOS
    })

    return (
        <Stack gap="md">
            <PageHeader>
                <Group justify="space-between" align="center" wrap="wrap" gap="sm" w="100%">
                    <Title order={4}>Buscar doctores</Title>
                    <TextInput
                        placeholder="Buscar por nombre..."
                        leftSection={<IconSearch size={16} />}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.currentTarget.value)}
                        w={{ base: '100%', sm: 240 }}
                    />
                </Group>
            </PageHeader>

            <Grid gutter={{ base: 'sm', md: 'md' }}>
                {/* Panel de filtros — ocupa toda la pantalla en mobile, 3 cols en desktop */}
                <Grid.Col span={{ base: 12, md: 3 }}>
                    <Card withBorder padding="md" radius="md">
                        <Stack gap="md">
                            <Title order={5}>Filtros</Title>

                            <Checkbox.Group
                                value={especialidadesClick}
                                onChange={setEspecialidadesClick}
                                label="Especialidad"
                            >
                                <Stack gap="xs" mt="xs">
                                    {especialidades.map(esp => (
                                        <Especialidad key={esp.id} value={esp.Especialidad} label={esp.Especialidad} />
                                    ))}
                                </Stack>
                            </Checkbox.Group>

                            <Select
                                label="Obra social"
                                placeholder="Todas"
                                clearable
                                data={['OSDE', 'Swiss Medical', 'Galeno', 'Medifé', 'Particular']}
                                value={obraSocial}
                                onChange={setObraSocial}
                            />

                            <Button
                                variant="outline"
                                color="gray"
                                fullWidth
                                onClick={() => {
                                    setBusqueda('')
                                    setEspecialidades([])
                                    setObraSocial(null)
                                }}
                            >
                                Limpiar filtros
                            </Button>
                        </Stack>
                    </Card>
                </Grid.Col>

                {/* Resultados — ocupa toda la pantalla en mobile, 9 cols en desktop */}
                <Grid.Col span={{ base: 12, md: 9 }}>
                    <Stack gap="md">
                        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                            <Text size="sm" c="orange">
                                Mostrando {doctoresFiltrados.length} de {mockDoctores.length} profesionales
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

                        {doctoresFiltrados.map(doc => (
                            <DoctorCard
                                key={doc.id}
                                doctor={doc}
                                onVerDisponibilidad={(d) => console.log('Ver disponibilidad:', d.nombre)}
                            />
                        ))}

                        {doctoresFiltrados.length === 0 && (
                            <Text c="dimmed" ta="center" mt="xl">
                                No se encontraron profesionales con esos filtros.
                            </Text>
                        )}
                    </Stack>
                </Grid.Col>
            </Grid>
        </Stack>
    )
}
