import { Center, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconLayoutDashboard } from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'

// Placeholder: the admin dashboard will grow here (metrics, shortcuts, ...).
export default function AdminInicio() {
  const { user } = useAuth()

  return (
    <>
      <PageHeader title="Inicio" subtitle={`Hola ${user?.nombre ?? ''}, este es tu panel de administración.`} />
      <Center h="60vh">
        <Stack align="center" gap="xs">
          <ThemeIcon size={56} radius="xl" variant="light"><IconLayoutDashboard size={30} /></ThemeIcon>
          <Text c="dimmed">Pronto vas a ver acá el resumen de tu consultorio.</Text>
        </Stack>
      </Center>
    </>
  )
}
