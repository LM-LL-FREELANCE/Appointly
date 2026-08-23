import {
  Anchor,
  Box,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  useMatches,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import professionalBg from "../assets/images/professionals-bg.svg"
import { useDisclosure } from '@mantine/hooks'
import { EnviarCorreo } from '../components/EmailModal.jsx'
import useSentEmailPassword from '../hooks/useSentEmailPassword.jsx'
import { IconCheck, IconX } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { useState, useEffect } from "react"

export default function ProfessionalLogin() {

  const { login, isLoggingIn, loginError } = useAuth()
  const navigate = useNavigate()
  const [forgotPassWordModal, { open: openforgotPassWordModal, close: closeforgotPassWordModal }] = useDisclosure(false)
  const [email, setEmail] = useState("")
  const [volverEnviar, setVolverEnviar] = useState(0)
  const relojActivo = volverEnviar > 0
  const { mutate: mutateEmail, isPending: isPendingEmail } = useSentEmailPassword()
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

  const handleCloseModal = () => {
    setVolverEnviar(0)
    notifications.hide("volverEnviar")
    closeforgotPassWordModal()
  }
  const handleSend = () => {
    mutateEmail({
      correo: email,
      role: "profesional"
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

  async function handleLogin(values) {
    try {
      await login(values)
      navigate("/dashboard")
    } catch (error) {
      console.error('Login fallido:', error)
    }

  }

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      dni: '',
      password: '',
      role: 'profesional'
    },
    validate: {
      dni: (value) => (/^\d{7,8}$/).test(value) ? null : 'El DNI debe tener 7 u 8 dígitos'
    }
  })

  const formMaxWidth = useMatches({
    base: '100%',
    sm: 450,
  });

  return (
    <>

      <Box
        mih={900}
        style={{
          backgroundSize: 'cover',
          backgroundImage: `url(${professionalBg})`
        }}
      >
        <Paper
          radius={0}
          mih={900}
          maw={formMaxWidth}
          p={30}
          pt={80}
          style={{
            borderRight: 'light-dark(1px solid var(--mantine-color-gray-3), 1px solid var(--mantine-color-dark-7))',
          }}
        >
          <Title
            order={2}
            ta="center"
            fw={500}
            mt="md"
            mb={50}
          >
            ¡Bienvenido!
          </Title>

          <form onSubmit={form.onSubmit(handleLogin)} noValidate>
            <TextInput
              label="DNI"
              placeholder="25331874" /* size="md" */
              key={form.key('dni')}
              {...form.getInputProps('dni')}
              radius="md" required />
            <PasswordInput
              label="Contraseña"
              placeholder="Tu contraseña"
              key={form.key('password')}
              {...form.getInputProps('password')}
              mt="md" /* size="md" */ radius="md" required />
            {/* <Checkbox label="Mantener la sesión iniciada" mt="xl" size="md" /> */}
            <Button fullWidth mt="xl" /* size="md" */ radius="md" type="submit" loading={isLoggingIn}>
              Iniciar sesión
            </Button>
          </form>

          {loginError ? (
            <Text c="red" size="sm" mt="md" ta="center">
              Credenciales no válidas
            </Text>
          ) : (
            <Text mb={51}></Text>
          )}
          <Center>
            <Stack gap="md">
              <Anchor align="center" fw={500} component="button" type="button" size="sm"
                onClick={openforgotPassWordModal}>
                ¿Olvidaste tu contraseña?
              </Anchor>
              <Text ta="center" size="sm">
                ¿Todavía no tienes una cuenta? {' '}
                <Anchor component={Link} to="/professional-signup" fw={500}>
                  Regístrate
                </Anchor>
              </Text>
            </Stack>
          </Center>
        </Paper>
      </Box>
      {forgotPassWordModal && (
        <EnviarCorreo
          opened={forgotPassWordModal}
          onClose={handleCloseModal}
          email={email}
          setEmail={setEmail}
          onConfirm={handleSend}
          isPending={isPendingEmail}
        />
      )
      }
    </>
  )
}
