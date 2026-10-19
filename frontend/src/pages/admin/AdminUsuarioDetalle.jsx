import { Center, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconUser } from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'

// Placeholder: WS1 reemplaza por la ficha real del usuario.
export default function AdminUsuarioDetalle() {
  return (
    <>
      <PageHeader title="Usuario" subtitle="Ficha completa de la cuenta." />
      <Center h="60vh">
        <Stack align="center" gap="xs">
          <ThemeIcon size={56} radius="xl" variant="light"><IconUser size={30} /></ThemeIcon>
          <Text c="dimmed">La ficha del usuario va a aparecer acá.</Text>
        </Stack>
      </Center>
    </>
  )
}
