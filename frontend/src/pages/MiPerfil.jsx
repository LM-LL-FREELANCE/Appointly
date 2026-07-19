import { useState, useRef } from 'react'
import { Group, Stack, Text, Avatar, Button, Paper, TextInput, Grid, Select, Flex, FileButton } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useMediaQuery } from '@mantine/hooks'
import { IconLock, IconCalendar } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader.jsx'
import { MultiSelectCombobox } from '../components/MultiSelectCombobox.jsx'
import { getProfesionalByDni } from '../api/profesionales.js'
import { useAuth } from '../hooks/useAuth.js'

// TODO: reemplazar por datos reales — getAllEspecialidades / useObrasSociales ya existen en api/profesionales.js
const ESPECIALIDADES_DATA = ['Clínica Médica', 'Cardiología', 'Dermatología', 'Pediatría', 'Traumatología', 'Ginecología', 'Oftalmología', 'Psiquiatría']
const OBRAS_SOCIALES_DATA = ['OSDE', 'Swiss Medical', 'IOMA', 'PAMI', 'Galeno', 'Medifé', 'Unión Personal', 'Sancor Salud']
const OPCIONES_GENERO = ['Masculino', 'Femenino', 'Prefiero no decirlo']

export default function MiPerfil() {
  const { user } = useAuth()
  const isProfesional = user?.role === 'profesional'
  const isMobile = useMediaQuery('(max-width: 768px)')
  // 'md' (15px) en mobile, no 'xs' (12px): index.css fuerza font-size:16px !important
  // en <input>/<select> para evitar el auto-zoom de iOS Safari. 'xs' quedaba
  // pisado ahí pero los <button> (Guardar, DatePickerInput) sí lo respetaban,
  // generando el desequilibrio de tamaños entre campos y botones.
  const inputSize = isMobile ? 'md' : 'sm'

  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [genero, setGenero] = useState(null)
  const [fechaNacimiento, setFechaNacimiento] = useState(null)
  const [especialidadesSel, setEspecialidadesSel] = useState([])
  const [obraSocialSel, setObraSocialSel] = useState([])
  const [foto, setFoto] = useState(null)
  const resetRef = useRef(null)

  const { data: perfil } = useQuery({
    queryKey: ['perfil', user?.dni],
    queryFn: () => getProfesionalByDni({ dni: user?.dni }),
  })

  const clearFoto = () => {
    setFoto(null)
    resetRef.current?.()
  }

  const avatarSrc = foto ? URL.createObjectURL(foto) : perfil?.foto_url ?? undefined

  return (
    <>
      <PageHeader>
        <Group justify="space-between" style={{ flex: 1 }}>
          <Text fw={600} fz={{ base: 'xl', sm: 'lg' }}>Mi perfil</Text>
          <Avatar radius="xl" alt="" />
        </Group>
      </PageHeader>

      <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'flex-start' }} gap="lg" p="md" pb="xl">
        <Stack align="center" w={{ base: '100%', md: 220 }} gap="md">
          <Stack align="center" gap="sm">
            <Avatar size={120} radius="50%" src={avatarSrc} />
            <Group gap="xs">
              <FileButton resetRef={resetRef} onChange={setFoto} accept="image/png,image/jpeg,image/webp">
                {(props) => (
                  <Button {...props} variant="outline" size={inputSize} color="dark">
                    Cambiar foto
                  </Button>
                )}
              </FileButton>
              <Button variant="subtle" size={inputSize} color="red" disabled={!foto} onClick={clearFoto}>
                Eliminar
              </Button>
            </Group>
          </Stack>
          <TextInput label="DNI" size={inputSize} value={user?.dni ?? ''} readOnly w="100%" />
        </Stack>

        <Paper withBorder p="xl" flex={1} radius="md" w="100%">
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Nombre"
                size={inputSize}
                value={perfil?.nombre ?? ''}
                readOnly
                rightSection={<IconLock size={16} color="var(--mantine-color-yellow-6)" />}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Apellido"
                size={inputSize}
                value={perfil?.apellido ?? ''}
                readOnly
                rightSection={<IconLock size={16} color="var(--mantine-color-yellow-6)" />}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Correo"
            size={inputSize}
            required
            mt="md"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />

          <Grid gutter="md" mt="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Teléfono"
                size={inputSize}
                placeholder="Ej: 11 2345-6789"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <DatePickerInput
                label="Fecha de nacimiento"
                size={inputSize}
                placeholder="Seleccione una fecha"
                value={fechaNacimiento}
                onChange={setFechaNacimiento}
                rightSection={<IconCalendar size={16} stroke={1.5} color="gray" />}
                locale="es"
                maxDate={new Date()}
              />
            </Grid.Col>
          </Grid>

          <Grid gutter="md" mt="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Género"
                size={inputSize}
                placeholder="Ej: Masculino"
                data={OPCIONES_GENERO}
                value={genero}
                onChange={setGenero}
              />
            </Grid.Col>
          </Grid>

          <Stack gap="md" mt="md">
            {isProfesional && (
              <MultiSelectCombobox
                label="Especialidades"
                size={inputSize}
                data={ESPECIALIDADES_DATA}
                value={especialidadesSel}
                onChange={setEspecialidadesSel}
                placeholder="+ agregar..."
              />
            )}

            <MultiSelectCombobox
              label={isProfesional ? 'Obras sociales' : 'Obra Social'}
              size={inputSize}
              data={OBRAS_SOCIALES_DATA}
              value={obraSocialSel}
              onChange={setObraSocialSel}
              placeholder="+ agregar..."
              maxSelected={isProfesional ? undefined : 1}
            />
          </Stack>

          <Group justify="flex-end" gap="sm" mt="xl" wrap="wrap">
            <Button color="red" variant="outline" size={inputSize} w={{ base: '100%', sm: 'auto' }}>
              Eliminar cuenta
            </Button>
            <Button size={inputSize} w={{ base: '100%', sm: 'auto' }}>
              Guardar
            </Button>
          </Group>
        </Paper>
      </Flex>
    </>
  )
}
