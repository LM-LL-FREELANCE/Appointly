import { useNavigate } from 'react-router-dom'
import { Paper, Stack, Title } from '@mantine/core'
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

  // A cliente account is active right away, so we sign the person in.
  const handleSubmit = (payload) => submit(payload, {
    onSuccess: async () => {
      try {
        await login({ dni: payload.dni, password: payload.password, role: 'cliente' })
        showSuccess({ title: 'Cuenta registrada', message: 'Ya iniciaste sesión.' })
        navigate(HOME_BY_ROLE.cliente)
      } catch {
        showSuccess({
          title: 'Cuenta registrada',
          message: 'Tu cuenta se creó, pero no pudimos iniciar sesión automáticamente. Iniciá sesión manualmente.',
        })
        navigate('/login')
      }
    },
  })

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
