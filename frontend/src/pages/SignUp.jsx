import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import RegisterForm from '../components/RegisterForm.jsx'
import useRegistroFlow from '../hooks/useRegistroFlow.jsx'
import useRegistroNotifications from '../hooks/useRegistroNotifications.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { HOME_BY_ROLE } from '../utils/roles.js'

export default function SignUp() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showSuccess } = useRegistroNotifications()
  const { submit, isPending, error } = useRegistroFlow({ role: 'cliente' })
  const [creada, setCreada] = useState(false)

  // A cliente account is active right away, so we sign the person in.
  const handleSubmit = (payload) => submit(payload, {
    onSuccess: async () => {
      setCreada(true)
      showSuccess({ title: '¡Cuenta registrada!', message: 'Bienvenido/a a Appointly.' })
      try {
        await login({ dni: payload.dni, password: payload.password, role: 'cliente' })
        setTimeout(() => {
          navigate(HOME_BY_ROLE.cliente)
        }, 1600)
      } catch {
        showSuccess({
          title: 'Cuenta registrada',
          message: 'Tu cuenta se creó, pero no pudimos iniciar sesión automáticamente. Iniciá sesión manualmente.',
        })
        setTimeout(() => {
          navigate('/login')
        }, 1600)
      }
    },
  })

  if (creada) {
    return (
      <Stack align="center" mx="md" justify="center" style={{ minHeight: '100vh' }}>
        <Paper withBorder p="xl" shadow="md" radius="md" w="100%" maw={560}>
          <Stack align="center" gap="md" ta="center" py="xl">
            <ThemeIcon size={64} radius="100%" color="teal" variant="light">
              <IconCheck size={36} stroke={2} />
            </ThemeIcon>
            <Title order={2} size="h3">¡Cuenta creada con éxito!</Title>
            <Text c="dimmed" size="sm">
              Bienvenido/a a Appointly. Preparando tu cuenta...
            </Text>
            <Loader size="sm" mt="xs" color="teal" />
          </Stack>
        </Paper>
      </Stack>
    )
  }

  return (
    <Stack align="center" mx="md" justify="center" style={{ minHeight: '100vh' }}>
      <Paper withBorder p="xl" shadow="md" radius="md" w="100%" maw={650}>
        <Stack px="sm" gap="md">
          <Title order={2} size="h3">Registrarse</Title>
          <RegisterForm
            role="cliente"
            onSubmit={handleSubmit}
            isPending={isPending}
            error={error}
            secondaryActions={[
              { label: 'Volver al inicio', onClick: () => navigate('/') },
              { label: 'Ya tengo una cuenta', onClick: () => navigate('/login'), variant: 'default' },
            ]}
          />
        </Stack>
      </Paper>
    </Stack>
  )
}
