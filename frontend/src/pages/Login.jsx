import {
  Anchor,
  Button,
  Checkbox,
  Container,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function Login() {

  const { login, isLoggingIn, loginError } = useAuth()
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


  return (
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
          <Group justify="space-between" mt="lg">
            {/* <Checkbox label="Mantener la sesión iniciada" /> */}
            <Anchor component="button" size="sm">
              ¿Olvidaste tu contraseña?
            </Anchor>
          </Group>
          <Button fullWidth mt="xl" radius="md" type="submit" loading={isLoggingIn}>
            Iniciar sesión
          </Button>

          {loginError ? (
            <Text c="red" size="sm" mt="md" ta="center">
              Credenciales no válidas
            </Text>
          ) : (
            <Text mb={51}></Text>
          )}

          <Text ta="center" size="sm" mt="md">
            ¿No tienes cuenta?{' '}
            <Anchor component={Link} to="/registrarse" fw={500}>
              Regístrate acá
            </Anchor>
          </Text>

          <Text ta="center" size="sm" mt="sm">
            ¿Eres profesional?{' '}
            <Anchor component={Link} to="/professional-login" fw={500}>
              Inicia sesión aquí
            </Anchor>
          </Text>


        </Paper>
      </form>
    </Container>
  );
}
