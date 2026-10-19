import { Center, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconSpeakerphone } from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'

// Placeholder: WS5 reemplaza por el centro de comunicaciones.
export default function AdminComunicaciones() {
  return (
    <>
      <PageHeader title="Comunicaciones" subtitle="Enviá correos a una cuenta o a un segmento." />
      <Center h="60vh">
        <Stack align="center" gap="xs">
          <ThemeIcon size={56} radius="xl" variant="light"><IconSpeakerphone size={30} /></ThemeIcon>
          <Text c="dimmed">Pronto vas a poder enviar comunicaciones desde acá.</Text>
        </Stack>
      </Center>
    </>
  )
}
