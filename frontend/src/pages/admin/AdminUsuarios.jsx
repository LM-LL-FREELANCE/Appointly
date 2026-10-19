import { Center, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconUsers } from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'

// Placeholder: WS1 reemplaza por el listado real de cuentas.
export default function AdminUsuarios() {
  return (
    <>
      <PageHeader title="Usuarios" subtitle="Buscá y gestioná las cuentas del centro." />
      <Center h="60vh">
        <Stack align="center" gap="xs">
          <ThemeIcon size={56} radius="xl" variant="light"><IconUsers size={30} /></ThemeIcon>
          <Text c="dimmed">Pronto vas a poder gestionar acá las cuentas de usuarios.</Text>
        </Stack>
      </Center>
    </>
  )
}
