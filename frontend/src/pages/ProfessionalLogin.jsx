import {
  Anchor,
  Box,
  Button,
  Checkbox,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  useMatches,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import professionalBg from "../assets/images/professional-login-bg.jpg"

export default function ProfessionalLogin() {

  const { login, isLoggingIn, loginError } = useAuth()
  const navigate = useNavigate()

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

        <form onSubmit={form.onSubmit(handleLogin)}>
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

        <Text ta="center" mt="md" size="sm">
          ¿Todavía no tienes una cuenta? {' '}
          <Anchor href="#" fw={500} onClick={(event) => event.preventDefault()}>
            Regístrate
          </Anchor>
        </Text>

        {/* <Text ta="center" size="sm" mt="md">
          ¿Eres paciente?{' '}
          <Anchor component={Link} to="/login" size="sm">
            Inicia sesión aquí
          </Anchor>
        </Text> */}
      </Paper>
    </Box>
  )
}