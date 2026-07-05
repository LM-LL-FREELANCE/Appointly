import { useState } from 'react'
import { Group, Stack, Text, Avatar, Button, Paper, TextInput, Grid, TagsInput, Space } from '@mantine/core'
import { IconLock } from '@tabler/icons-react'
import { PageHeader } from '../components/PageHeader.jsx'

export default function MiPerfil() {
  const [especialidades, setEspecialidades] = useState(['Kinesiología', 'Kinesiología deportiva'])
  const [obrasSociales, setObrasSociales] = useState(['OSDE', 'Swiss Medical', 'Particular'])

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

      <Group align="flex-start" gap="lg" p="md" wrap="nowrap" visibleFrom="md">
        <Stack align="center" w={220} gap="md">
          <Avatar size={120} radius="50%" />
          <Button variant="outline" size="sm" color="dark">Cambiar foto</Button>
          <Stack w="100%" gap={4}>
            <Text size="sm" c="dimmed">DNI</Text>
            <TextInput value="27890123" readOnly />
          </Stack>
        </Stack>

        <Paper withBorder p="xl" flex={1} radius="md">
          <Grid gutter="md">
            <Grid.Col span={6}>
              <TextInput
                label="Nombre"
                value="Marta"
                readOnly
                rightSection={<IconLock size={16} color="var(--mantine-color-yellow-6)" />}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Apellido"
                value="Pérez"
                readOnly
                rightSection={<IconLock size={16} color="var(--mantine-color-yellow-6)" />}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Correo"
            required
            mt="md"
            value="m.perez@appointly.app"
          />

          <Space h="xl" />

          <TagsInput
            label="Especialidades"
            value={especialidades}
            onChange={setEspecialidades}
            placeholder="+ agregar..."
          />

          <TagsInput
            label="Obras sociales"
            value={obrasSociales}
            onChange={setObrasSociales}
            placeholder="+ agregar..."
            mt="sm"
          />
        </Paper>
      </Group>
    </>
  )
}
