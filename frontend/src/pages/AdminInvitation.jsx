import { Button, Center, Loader, Paper, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useNavigate, useParams } from 'react-router-dom'
import RegisterForm from '../components/RegisterForm.jsx'
import useRegistroFlow from '../hooks/useRegistroFlow.jsx'
import useRegistroNotifications from '../hooks/useRegistroNotifications.jsx'
import useGetErrosMsg from '../hooks/useGetErrosMsg.jsx'
import { useValidarInvitacion } from '../hooks/useInvitacion.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { HOME_BY_ROLE } from '../utils/roles.js'

function Screen({ children }) {
  return (
    <Center mih="100vh" px="md">
      <Paper withBorder shadow="md" radius="md" p="xl" maw={560} w="100%">{children}</Paper>
    </Center>
  )
}

export default function AdminInvitation() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const { errorMessage } = useGetErrosMsg()
  const { showSuccess } = useRegistroNotifications()
  const { data: invitacion, isPending, error: invalid } = useValidarInvitacion(token)
  const { submit, isPending: isSubmitting, error } = useRegistroFlow({ role: 'admin', token })

  if (isPending) return <Center mih="100vh"><Loader size="xl" /></Center>

  const rolIncompatible = invitacion && invitacion.role !== 'admin'

  if (invalid || rolIncompatible) {
    return (
      <Screen>
        <Stack align="center" gap="md" ta="center">
          <Title order={2} size="h3">No pudimos usar esta invitación</Title>
          <Text c="dimmed">
            {rolIncompatible
              ? 'Este enlace corresponde a una invitación de profesional, no de administrador.'
              : errorMessage(invalid?.code)}
          </Text>
          <Button onClick={() => navigate(rolIncompatible ? `/registro/profesional/${token}` : '/admin-login')}>
            {rolIncompatible ? 'Ir al registro de profesional' : 'Ir a iniciar sesión'}
          </Button>
        </Stack>
      </Screen>
    )
  }

  // The account is created straight away (the invitation is the authorization).
  const handleSubmit = (payload) => submit(payload, {
    onSuccess: async (account) => {
      notifications.hide('registrandose')
      try {
        await login({ dni: String(account.dni), password: payload.password, role: 'admin' })
        showSuccess({ title: 'Cuenta creada', message: 'Bienvenido/a al panel de administración.' })
        navigate(HOME_BY_ROLE.admin, { replace: true })
      } catch {
        navigate('/admin-login', { replace: true })
      }
    },
  })

  return (
    <Screen>
      <Stack gap="md">
        <Title order={2} size="h3">Registro de administrador</Title>
        {invitacion.persona && (
          <Text c="dimmed" size="sm">
            Hola {invitacion.persona.nombre} {invitacion.persona.apellido}. Ya tenemos tus datos personales:
            solo elegí una contraseña para tu cuenta de administrador.
          </Text>
        )}
        <RegisterForm
          role="admin"
          lockedDni={String(invitacion.dni)}
          lockedCorreo={invitacion.correo}
          hidePersonalData={!!invitacion.persona}
          submitLabel="Crear cuenta de administrador"
          onSubmit={handleSubmit}
          isPending={isSubmitting}
          error={error}
        />
      </Stack>
    </Screen>
  )
}
