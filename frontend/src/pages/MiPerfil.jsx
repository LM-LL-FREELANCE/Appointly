import { useState, useRef } from 'react'
import { Group, Stack, Text, Avatar, Button, Paper, TextInput, Grid, TagsInput, Space, FileButton } from '@mantine/core'
import { IconLock } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader.jsx'
import { getProfesionalByDni } from '../api/profesionales.js'
import { useAuth } from '../hooks/useAuth.js'

export default function MiPerfil() {
  const { user } = useAuth()

  const [correo, setCorreo] = useState('')
  const [foto, setFoto] = useState(null)
  const resetRef = useRef(null)

  const { data: perfil } = useQuery({
    queryKey: ['perfil', user?.dni],
    queryFn: () => getProfesionalByDni({ dni: user?.dni }),
  })

  const especialidades = perfil?.especialidad?.map(e => e.especialidad) ?? []
  const obrasSociales = perfil?.obraSociales?.map(o => o.obra_sociales) ?? []

  const clearFoto = () => {
    setFoto(null)
    resetRef.current?.()
  }

  const avatarSrc = foto ? URL.createObjectURL(foto) : perfil?.foto_url ?? undefined

  const photoSection = (
    <Stack align="center" gap="sm">
      <Avatar
        size={120}
        radius="50%"
        src={avatarSrc}
      />
      <Group gap="xs">
        <FileButton resetRef={resetRef} onChange={setFoto} accept="image/png,image/jpeg,image/webp">
          {(props) => (
            <Button {...props} variant="outline" size="sm" color="dark">
              Cambiar foto
            </Button>
          )}
        </FileButton>
        <Button variant="subtle" size="sm" color="red" disabled={!foto} onClick={clearFoto}>
          Eliminar
        </Button>
      </Group>
    </Stack>
  )

  return (
    <>
      <PageHeader>
        <Group justify="space-between" style={{ flex: 1 }}>
          <Stack gap={0}>
            <Text fw={600} fz={{ base: 'xl', sm: 'lg' }}>Mi perfil</Text>
          </Stack>
          <Group visibleFrom="sm">
            <Button visibleFrom="md">Guardar</Button>
            <Avatar radius="xl" alt="" />
          </Group>
        </Group>
      </PageHeader>

      {/* Mobile layout */}
      <Stack gap="md" px="md" pb="xl" hiddenFrom="md">
        {photoSection}

        <TextInput
          label="Nombre"
          value={perfil?.nombre ?? ''}
          readOnly
          rightSection={<IconLock size={16} color="var(--mantine-color-yellow-6)" />}
        />
        <TextInput
          label="Apellido"
          value={perfil?.apellido ?? ''}
          readOnly
          rightSection={<IconLock size={16} color="var(--mantine-color-yellow-6)" />}
        />
        <TextInput label="DNI" value={user?.dni} readOnly />
        <TextInput label="Correo" required value={correo} onChange={(e) => setCorreo(e.target.value)} />

        <TagsInput
          label="Especialidades"
          value={especialidades}
          onChange={() => { }}
          placeholder="+ agregar..."
        />
        <TagsInput
          label="Obras sociales"
          value={obrasSociales}
          onChange={() => { }}
          placeholder="+ agregar..."
        />

        <Button fullWidth mt="sm">Guardar</Button>
      </Stack>

      {/* Desktop layout */}
      <Group align="flex-start" gap="lg" p="md" wrap="nowrap" visibleFrom="md">
        <Stack align="center" w={220} gap="md">
          {photoSection}
          <Stack w="100%" gap={4}>
            <Text size="sm" c="dimmed">DNI</Text>
            <TextInput value={user?.dni} readOnly />
          </Stack>
        </Stack>

        <Paper withBorder p="xl" flex={1} radius="md">
          <Grid gutter="md">
            <Grid.Col span={6}>
              <TextInput
                label="Nombre"
                value={perfil?.nombre ?? ''}
                readOnly
                rightSection={<IconLock size={16} color="var(--mantine-color-yellow-6)" />}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Apellido"
                value={perfil?.apellido ?? ''}
                readOnly
                rightSection={<IconLock size={16} color="var(--mantine-color-yellow-6)" />}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Correo"
            required
            mt="md"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />

          <Space h="xl" />

          <TagsInput
            label="Especialidades"
            value={especialidades}
            onChange={() => { }}
            placeholder="+ agregar..."
          />

          <TagsInput
            label="Obras sociales"
            value={obrasSociales}
            onChange={() => { }}
            placeholder="+ agregar..."
            mt="sm"
          />
        </Paper>
      </Group>
    </>
  )
}
