import { Center, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconBooks } from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'

// Placeholder: WS2 reemplaza por la gestión de especialidades y obras sociales.
export default function AdminCatalogos() {
  return (
    <>
      <PageHeader title="Catálogos" subtitle="Especialidades y obras sociales que ofrece el centro." />
      <Center h="60vh">
        <Stack align="center" gap="xs">
          <ThemeIcon size={56} radius="xl" variant="light"><IconBooks size={30} /></ThemeIcon>
          <Text c="dimmed">Pronto vas a poder administrar especialidades y obras sociales.</Text>
        </Stack>
      </Center>
    </>
  )
}
