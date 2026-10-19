import { Center, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconCalendarStats } from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'

// Placeholder: WS4 reemplaza por el monitor global de turnos.
export default function AdminTurnos() {
  return (
    <>
      <PageHeader title="Turnos" subtitle="Monitor global de turnos del centro." />
      <Center h="60vh">
        <Stack align="center" gap="xs">
          <ThemeIcon size={56} radius="xl" variant="light"><IconCalendarStats size={30} /></ThemeIcon>
          <Text c="dimmed">Pronto vas a ver acá el monitor global de turnos.</Text>
        </Stack>
      </Center>
    </>
  )
}
