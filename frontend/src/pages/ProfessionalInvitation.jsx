import { useState } from 'react'
import { Button, Center, Loader, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
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

export default function ProfessionalInvitation() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const { errorMessage } = useGetErrosMsg()
  const { showSuccess } = useRegistroNotifications()
  const { data: invitacion, isPending, error: invalid } = useValidarInvitacion(token)
  const { submit, isPending: isSubmitting, error } = useRegistroFlow({ role: 'profesional', token })
  const [creada, setCreada] = useState(false)

  if (isPending) return <Center mih="100vh"><Loader size="xl" /></Center>

  const rolIncompatible = invitacion && invitacion.role !== 'profesional'

  if (invalid || rolIncompatible) {
    return (
      <Screen>
        <Stack align="center" gap="md" ta="center">
          <Title order={2} size="h3">No pudimos usar esta invitación</Title>
          <Text c="dimmed">
            {rolIncompatible
              ? 'Este enlace corresponde a una invitación de administrador, no de profesional.'
              : errorMessage(invalid?.code)}
          </Text>
          <Button onClick={() => navigate(rolIncompatible ? `/registro/admin/${token}` : '/professional-login')}>
            {rolIncompatible ? 'Ir al registro de administrador' : 'Ir a iniciar sesión'}
          </Button>
        </Stack>
      </Screen>
    )
  }

  // The account is created straight away (the invitation is the authorization).
  const handleSubmit = (payload) => submit(payload, {
    onSuccess: async (account) => {
      notifications.hide('registrandose')
      setCreada(true)
      showSuccess({ title: '¡Cuenta creada!', message: 'Bienvenido/a a tu panel profesional.' })
      try {
        await login({ dni: String(account.dni), password: payload.password, role: 'profesional' })
        setTimeout(() => {
          navigate(HOME_BY_ROLE.profesional, { replace: true })
        }, 1600)
      } catch {
        setTimeout(() => {
          navigate('/professional-login', { replace: true })
        }, 1600)
      }
    },
  })

  if (creada) {
    return (
      <Screen>
        <Stack align="center" gap="md" ta="center" py="xl">
          <ThemeIcon size={64} radius="100%" color="teal" variant="light">
            <IconCheck size={36} stroke={2} />
          </ThemeIcon>
          <Title order={2} size="h3">¡Cuenta creada con éxito!</Title>
          <Text c="dimmed" size="sm">
            Bienvenido/a a tu panel profesional. Preparando tu espacio de trabajo...
          </Text>
          <Loader size="sm" mt="xs" color="teal" />
        </Stack>
      </Screen>
    )
  }

  return (
    <Screen>
      <Stack gap="md">
        <Title order={2} size="h3">Registro de profesional</Title>
        {invitacion.persona && (
          <Text c="dimmed" size="sm">
            Hola {invitacion.persona.nombre} {invitacion.persona.apellido}. Ya tenemos tus datos personales:
            solo completá tu matrícula y contraseña para tu cuenta de profesional.
          </Text>
        )}
        <RegisterForm
          role="profesional"
          lockedDni={String(invitacion.dni)}
          lockedCorreo={invitacion.correo}
          hidePersonalData={!!invitacion.persona}
          submitLabel="Crear cuenta de profesional"
          onSubmit={handleSubmit}
          isPending={isSubmitting}
          error={error}
        />
      </Stack>
    </Screen>
  )
}
