import { Anchor, Box, Paper, Text, Title, useMatches } from '@mantine/core'
import { Link, useNavigate } from 'react-router-dom'
import RegisterForm from '../components/RegisterForm.jsx'
import useRegistroFlow from '../hooks/useRegistroFlow.jsx'
import professionalBg from '../assets/images/professionals-bg.svg'
import { notifications } from '@mantine/notifications'

export default function ProfessionalSignUp() {
  const navigate = useNavigate()
  const formMaxWidth = useMatches({ base: '100%', sm: 550 })
  const { submit, isPending, error } = useRegistroFlow({ role: 'profesional' })

  // A profesional only files a request: the account stays pendiente until an
  // admin approves it, so there is no automatic login here.
  const handleSubmit = (payload) => submit(payload, {
    onSuccess: () => {
      notifications.hide('registrandose')
      navigate('/solicitud-enviada', { replace: true })
    },
  })

  return (
    <Box style={{ backgroundSize: 'cover', backgroundImage: `url(${professionalBg})`, minHeight: '100vh' }}>
      <Paper
        radius={0} mih="100vh" maw={formMaxWidth} p={30} pt={80} pb={80}
        style={{ borderRight: 'light-dark(1px solid var(--mantine-color-gray-3), 1px solid var(--mantine-color-dark-7))' }}
      >
        <Title order={2} ta="center" fw={500} mb={50}>Solicitá tu cuenta de profesional</Title>

        <RegisterForm
          role="profesional"
          submitLabel="Enviar solicitud"
          onSubmit={handleSubmit}
          isPending={isPending}
          error={error}
          secondaryActions={[
            { label: 'Volver al inicio', onClick: () => navigate('/') },
            { label: 'Ya tengo una cuenta', onClick: () => navigate('/professional-login'), variant: 'default' },
          ]}
        />

        <Text ta="center" mt="md" size="sm">
          ¿Ya tienes una cuenta?{' '}
          <Anchor component={Link} to="/professional-login" fw={500}>Inicia sesión aquí</Anchor>
        </Text>
      </Paper>
    </Box>
  )
}
