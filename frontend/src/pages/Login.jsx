import {
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { useDisclosure } from "@mantine/hooks";
import { useForm } from '@mantine/form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { EnviarCorreo } from '../components/EmailModal.jsx';
import { notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { useState } from 'react';
import useSentEmailPassword from '../hooks/useSentEmailPassword.jsx';
import { IconX } from '@tabler/icons-react';
import useNotificationCountDown from '../hooks/useNotificationCountDown.jsx';

export default function Login() {
  const [forgotPassWordModal, { open: openforgotPassWordModal, close: closeforgotPassWordModal }] =
    useDisclosure(false)
  const { login, isLoggingIn, loginError } = useAuth()
  const [volverEnviar, setVolverEnviar] = useState(0)
  const [email, setEmail] = useState("")
  const navigate = useNavigate()

  async function handleLogin(values) {
    try {
      await login(values)
      navigate("/")
    } catch (error) {
      console.error('Login fallido:', error)
    }
  }

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      dni: '',
      password: '',
      role: 'cliente'
    },
    validate: {
      dni: (value) => (/^\d{7,8}$/).test(value) ? null : 'El DNI debe tener 7 u 8 dígitos'
    }
  })

  const { mutate: mutateEmail, isPending: isPendingEmail } = useSentEmailPassword()
  const { startCountDown, time, setTime } = useNotificationCountDown()
  const notAvailable = time > 0

  const handleConfirm = () => {
    notifications.show({
      id: "volverEnviar",
      title: 'Espera un momento...',
      message: 'Estamos enviando tu correo.',
      position: 'top-right',
      withCloseButton: false,
      autoClose: false,
      loading: true
    })
    setTimeout(() => {
      mutateEmail({
        correo: email,
        role: "cliente"
      }, {
        onSuccess: () => {
          startCountDown({
            initialTime: 31, notificationConfig: {
              id: "volverEnviar",
              title: "Correo Enviado",
              message: (tiempoRestante) => `Podras enviar otro correo en ${tiempoRestante}s`
            }
          })
        },
        onError: () => {
          notifications.update({
            id: 'volverEnviar',
            title: 'Error al enviar',
            message: 'Sucedió un error, verifica que el correo al que quieres mandar tiene asociada una cuenta.',
            color: 'red',
            icon: <IconX />,
            autoClose: 3000,
            withCloseButton: true,
            position: 'top-right',
            loading: false,
          })
        }
      })
    }, 2000)
  }

  const closeModal = () => {
    setTime(0)
    notifications.hide("volverEnviar")
    closeforgotPassWordModal()
  }


  return (
    <>
      <Container size={420} my={100}>
        <Title
          ta="center"
          fw={500}
          mb="lg"
        >
          ¡Bienvenido de nuevo!
        </Title>

        <form onSubmit={form.onSubmit(handleLogin)} noValidate>
          <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
            <TextInput
              label="DNI"
              placeholder="25331874"
              key={form.key('dni')}
              {...form.getInputProps('dni')}
              required radius="md" />
            <PasswordInput
              label="Contraseña"
              placeholder="Tu contraseña"
              key={form.key('password')}
              {...form.getInputProps('password')}
              required mt="md" radius="md" />

            <Button fullWidth mt="xl" radius="md" type="submit" loading={isLoggingIn}>
              Iniciar sesión
            </Button>

            {loginError && (
              <Text c="red" size="sm" mt="sm" ta="center">
                Credenciales no válidas
              </Text>
            )}

            <Stack gap="md" mt="xl">
              <Anchor align="center" fw={500} component="button" type="button" size="sm"
                onClick={openforgotPassWordModal}>
                ¿Olvidaste tu contraseña?
              </Anchor>

              <Text ta="center" size="sm">
                ¿No tienes cuenta?{' '}
                <Anchor component={Link} to="/registrarse" fw={500}>
                  Regístrate acá
                </Anchor>
              </Text>

              <Text ta="center" size="sm">
                ¿Eres profesional?{' '}
                <Anchor component={Link} to="/professional-login" fw={500}>
                  Inicia sesión aquí
                </Anchor>
              </Text>
            </Stack>
          </Paper>
        </form>
      </Container>

      {forgotPassWordModal && (
        <EnviarCorreo
          opened={forgotPassWordModal}
          onClose={closeModal}
          onConfirm={handleConfirm}
          isPending={isPendingEmail}
          isNotAvailble={notAvailable}
          email={email}
          setEmail={setEmail}
        />
      )}
    </>
  );
}