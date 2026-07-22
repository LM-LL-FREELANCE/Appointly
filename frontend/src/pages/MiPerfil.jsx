import { useState, useRef, useEffect } from 'react'
import { Group, Stack, Text, Avatar, Button, Paper, TextInput, Grid, Select, Flex, FileButton } from
  '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useMediaQuery } from '@mantine/hooks'
import { IconLock, IconCalendar } from '@tabler/icons-react'
import { PageHeader } from '../components/PageHeader.jsx'
import { MultiSelectCombobox } from '../components/MultiSelectCombobox.jsx'
import { useAuth } from '../hooks/useAuth.js'
import useGetCliente from '../hooks/useGetClienteData.jsx'
import useGetProfesional from '../hooks/useGetProfesionalData.jsx'

// TODO: reemplazar por datos reales — getAllEspecialidades / useObrasSociales ya existen en

const ESPECIALIDADES_DATA = ['Clínica Médica', 'Cardiología', 'Dermatología', 'Pediatría', 'Traumatología',
  'Ginecología', 'Oftalmología', 'Psiquiatría']
const OBRAS_SOCIALES_DATA = ['OSDE', 'Swiss Medical', 'IOMA', 'PAMI', 'Galeno', 'Medifé', 'Unión Personal',
  'Sancor Salud']
const OPCIONES_GENERO = ['Masculino', 'Femenino', 'Prefiero no decirlo']

export default function MiPerfil() {
  const { user, isAuthLoading } = useAuth()
  console.log("ESTADO DE AUTH:", { isAuthLoading, user })
  const isMobile = useMediaQuery('(max-width: 768px)')
  const inputSize = isMobile ? 'md' : 'sm'

  //request with data
  const { data: perfil } = useGetProfesional({
    dni: user ? user.dni : undefined,
    rol: user ? user.role : undefined
  })

  const { data: perfilCliente } = useGetCliente({
    dni: user ? user.dni : undefined,
    rol: user ? user.role : undefined
  })

  console.log("profesional", perfil)
  console.log("cliente", perfilCliente)
  const perfilData = user?.role === "profesional" ? perfil : perfilCliente

  //states for the inputs
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [correo, setCorreo] = useState("")
  const [genero, setGenero] = useState(null)
  const [fechaNacimiento, setFechaNacimiento] = useState(null)
  const [especialidadesSel, setEspecialidadesSel] = useState([])
  const [obraSocialSel, setObraSocialSel] = useState([])

  useEffect(() => {
    if (perfilData) {
      setNombre(perfilData.nombre || "")
      setApellido(perfilData.apellido || "")
      setCorreo(perfilData.correo || "")
      setGenero(perfilData.genero || null)

      // Si existe una fecha, la convertimos a Date para el DatePicker
      if (perfilData.fecha_nacimiento) {
        // Aseguramos de arreglar la zona horaria si viene en string UTC agregando 'T00:00:00'
        setFechaNacimiento(new Date(perfilData.fecha_nacimiento))
      }

      // Si las especialidades u obras vienen como array, las seteamos aquí
      // (ajusta las propiedades .especialidades si tu backend las manda de otra forma)
      // setEspecialidadesSel(perfilData.especialidad?.map(e => e.especialidad) || [])
    }
  }, [perfilData])

  const [foto, setFoto] = useState(null)
  const resetRef = useRef(null)

  const clearFoto = () => {
    setFoto(null)
    resetRef.current?.()
  }
  const avatarSrc = foto ? URL.createObjectURL(foto) : perfilData?.foto_url ?? undefined

  return (
    <>
      <PageHeader>
        <Group justify="space-between" style={{ flex: 1 }}>
          <Text fw={600} fz={{ base: 'xl', sm: 'lg' }}>Mi perfil</Text>
          <Avatar radius="xl" alt="" />
        </Group>
      </PageHeader>

      <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'flex-start' }} gap="lg"
        p="md" pb="xl">
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
          <TextInput label="DNI" size={inputSize} value={user?.dni ?? ''} readOnly w="100%"
            rightSection={<IconLock size={16} color="var(--mantine-color-yellow-6)" />}
          />
        </Stack>

        <Paper withBorder p="xl" flex={1} radius="md" w="100%">
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Nombre"
                size={inputSize}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Apellido"
                size={inputSize}
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Correo"
            size={inputSize}
            mt="md"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />

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

          <Stack gap="md" mt="md">
            {user?.role === "profesional" && (
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
              label={user?.role === "profesional" ? 'Obras sociales' : 'Obra Social'}
              size={inputSize}
              data={OBRAS_SOCIALES_DATA}
              value={obraSocialSel}
              onChange={setObraSocialSel}
              placeholder="+ agregar..."
              maxSelected={user?.role === "profesional" ? undefined : 1}
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