import { IconArrowLeft } from '@tabler/icons-react';
import {
  Center,
  Container,
  Group,
  Paper,
  Text,
  PasswordInput,
  Title,
  Stack,
  Loader
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ButtonLay from '../components/Button.jsx';
import useResetPassword from '../hooks/useResetPassword.jsx';
import useVerifyToken from '../hooks/useVerifyToken.jsx';
import { notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { IconCheck, IconX } from '@tabler/icons-react';

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setconfirmPassword] = useState("")
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [duracion, setDuracion] = useState(0)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const navigate = useNavigate()
  const { token } = useParams()
  const { isPending, isError } = useVerifyToken(token ?? "nothing")
  const { mutate: mutateReset, isPending: isPendingReset } = useResetPassword()

  useEffect(() => {
    if (isRedirecting) {
      if (duracion > 0) {
        notifications.update({
          id: "enviando",
          title: 'Contraseña actualizada',
          message: `Redirigiendo a iniciar sesión en ${duracion}s...`,
          position: 'top-center',
          icon: <IconCheck />,
          withCloseButton: false,
          autoClose: false,
          color: 'green'
        })
        const timer = setTimeout(() => setDuracion(duracion - 1), 1000)
        return () => clearTimeout(timer)
      } else {
        notifications.hide("enviando")
        navigate("/login")
      }
    }
  }, [duracion, isRedirecting, navigate])

  if (isPending) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }
  if (isError || !token) {
    return (
      <Center h="100vh">
        <Container size={400}>
          <Paper withBorder shadow="md" p={30} radius="md" ta="center">
            <Title>Enlace expirado</Title>
            <Text c="dimmed" mt="sm" mb="lg">
              Por razones de seguridad, este enlace ya no es válido.
              Por favor vuelve a solicitar recuperar tu contraseña.
            </Text>
            <ButtonLay label={"Volver al iniciar sesion"} onClick={() => navigate("/login")} />
          </Paper>
        </Container>
      </Center>
    );
  }
  const getErrorMsg = () => {
    if (hasSubmitted && confirmPassword.trim() === '') {
      return "El campo de confirmación no puede estar vacío";
    }
    if (confirmPassword.length > 0 && password !== confirmPassword) {
      return "Las contraseñas no son iguales, intenta de nuevo";
    }
    if (confirmPassword.length > 0 && confirmPassword.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres";
    }
    return null;
  }
  const errorMsg = getErrorMsg()
  const handleSubmit = (e) => {
    e.preventDefault()
    setHasSubmitted(true)
    if (getErrorMsg() !== null) {
      return
    }
    notifications.show({
      id: "enviando",
      title: 'Espera un momento...',
      message: 'Estamos actulizando tu contraseña',
      position: 'top-center',
      withCloseButton: false,
      autoClose: false,
      loading: true
    })
    mutateReset({
      token: token,
      password: password,
      confirmPassword: confirmPassword
    }, {
      onSuccess: () => {
        setIsRedirecting(true)
        setDuracion(5)
        // Como ya existe la noti de carga, usamos update en lugar de show
        notifications.update({
          id: "enviando",
          title: 'Contraseña actualizada',
          message: 'Redirigiendo...',
          position: 'top-center',
          icon: <IconCheck />,
          withCloseButton: false,
          autoClose: false,
          color: 'green',
          loading: false // Importante quitar el loading
        })
      },
      onError: (error) => {
        notifications.update({
          id: "enviando",
          title: 'Error al restablecer',
          message: 'Hubo un problema. Es posible que el enlace haya expirado.',
          position: 'top-center',
          icon: <IconX />,
          withCloseButton: true,
          autoClose: 5000,
          color: 'red',
          loading: false
        })
      }
    })
  }
  return (
    <Center h="90vh">
      <Container size={460} w="100%">
        <Title ta="center">
          Restablece tu contraseña
        </Title>
        <Text c="dimmed" fz="sm" ta="center">
          Ingrese su nueva contraseña
        </Text>

        <Paper withBorder shadow="md" p={30} radius="md" mt="xl">
          <form onSubmit={handleSubmit}>
            <Stack>
              <PasswordInput
                label="Tu nueva contraseña"
                required value={password} onChange={(e) => setPassword(e.target.value)}
                error={errorMsg}
              />
              <PasswordInput
                label="Escriba de nuevo la contraseña" required
                value={confirmPassword} onChange={(e) => setconfirmPassword(e.target.value)}
                error={errorMsg}
              />
              <Group justify="space-between" mt="lg" >
                <ButtonLay leftSection={<IconArrowLeft />} disabled={isPendingReset} typeColor={"outline"} label={"Volver al inicio de sesion"} onClick={() => navigate("/login")} />
                <ButtonLay onClick={handleSubmit} label={"Restablecer"} type="submit" disabled={isPendingReset} />
              </Group>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Center>
  )
}