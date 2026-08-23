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
import { useEffect, useState } from 'react';
import useSentEmailPassword from '../hooks/useSentEmailPassword.jsx';
import { IconCheck, IconX } from '@tabler/icons-react';

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

  const handleConfirm = () => {
    mutateEmail({
      correo: email,
      role: "cliente"
    }, {
      onSuccess: () => {
        setVolverEnviar(60);
        notifications.show({
          id: "volverEnviar",
          title: 'Correo enviado',
          message: 'Podrás enviar otro correo en 60s',
          position: 'top-center',
          icon: <IconCheck />,
          withCloseButton: false,
          autoClose: false,
          color: 'green'
        });
      },
      onError: () => {
        notifications.show({
          id: 'errorEnviar',
          title: 'Error al enviar',
          message: 'Sucedió un error, verifica que todo lo que ingresaste es correcto.',
          color: 'red',
          icon: <IconX />,
          autoClose: 3000,
          withCloseButton: true,
          position: 'top-center',
        })
      }
    })
  }

  const closeModal = () => {
    setVolverEnviar(0)
    notifications.hide("volverEnviar")
    closeforgotPassWordModal()
  }

  const relojActivo = volverEnviar > 0;

  useEffect(() => {
    if (!relojActivo) {
      notifications.hide("volverEnviar");
      return;
    }

    const reloj = setInterval(() => {
      setVolverEnviar((prev) => {
        const nuevoTiempo = prev - 1;

        if (nuevoTiempo > 0) {
          notifications.update({
            id: "volverEnviar",
            title: 'Correo enviado',
            message: `Podrás enviar otro correo en ${nuevoTiempo}s`,
            position: 'top-center',
            withCloseButton: false,
            autoClose: false,
            color: 'green'
          });
        }

        return nuevoTiempo;
      });
    }, 1000);

    return () => clearInterval(reloj);
  }, [relojActivo]);

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
          isNotAvailble={volverEnviar}
          email={email}
          setEmail={setEmail}
        />
      )}
    </>
  );
}