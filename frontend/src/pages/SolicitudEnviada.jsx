import { Button, Center, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconClockCheck } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

export default function SolicitudEnviada() {
  const navigate = useNavigate()

  return (
    <Center mih="100vh" px="md">
      <Paper withBorder shadow="md" radius="md" p="xl" maw={480} w="100%">
        <Stack align="center" gap="md" ta="center">
          <ThemeIcon size={64} radius="xl" variant="light" color="teal">
            <IconClockCheck size={36} />
          </ThemeIcon>
          <Title order={2} size="h3">Solicitud enviada</Title>
          <Text c="dimmed">
            Recibimos tus datos. Un administrador va a revisarlos y, cuando tu cuenta sea aprobada,
            vas a poder iniciar sesión como profesional.
          </Text>
          <Button fullWidth onClick={() => navigate('/professional-login')}>Ir a iniciar sesión</Button>
          <Button fullWidth variant="subtle" color="gray" onClick={() => navigate('/')}>Volver al inicio</Button>
        </Stack>
      </Paper>
    </Center>
  )
}
