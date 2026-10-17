import { Center, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'

// Placeholder: admin settings will live here.
export default function AdminConfiguracion() {
  return (
    <>
      <PageHeader title="Configuración" subtitle="Preferencias de tu cuenta de administrador." />
      <Center h="60vh">
        <Stack align="center" gap="xs">
          <ThemeIcon size={56} radius="xl" variant="light"><IconSettings size={30} /></ThemeIcon>
          <Text c="dimmed">Todavía no hay opciones de configuración.</Text>
        </Stack>
      </Center>
    </>
  )
}
