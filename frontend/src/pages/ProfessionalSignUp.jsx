import {
  Anchor,
  Box,
  Button,
  Paper,
  PasswordInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  useMatches,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { matchesField, useForm } from '@mantine/form'
import { IconAlertCircle, IconCalendar, IconX } from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router-dom'
import 'dayjs/locale/es'
import { useAuth } from '../hooks/useAuth.js'
import useRegisterProfesional from '../hooks/useRegisterProfesional.jsx'
import professionalBg from '../assets/images/professionals-bg.svg'
import useNotificationCountDown from '../hooks/useNotificationCountDown.jsx'
import { notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import useGetErrosMsg from '../hooks/useGetErrosMsg.jsx'


const opcionesDeGenero = ['Masculino', 'Femenino', 'Prefiero no decirlo']

export default function ProfessionalSignUp() {
  const navigate = useNavigate()
  const { login, isLoggingIn } = useAuth()

  const formMaxWidth = useMatches({
    base: '100%',
    sm: 550,
  })

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      dni: '',
      nombre: '',
      apellido: '',
      fecha_nacimiento: null,
      genero: null,
      correo: '',
      password: '',
      confirm: '',
      numero_matricula: ''
    },
    validate: {
      dni: (value) => (/^\d{7,8}$/).test(value) ? null : 'El DNI debe tener 7 u 8 dígitos',
      nombre: (value) => value.trim().length > 0 ? null : 'El nombre es obligatorio',
      apellido: (value) => value.trim().length > 0 ? null : 'El apellido es obligatorio',
      fecha_nacimiento: (value) => value ? null : 'Selecciona una fecha',
      genero: (value) => value ? null : 'Selecciona un género',
      correo: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(value) ? null : 'Formato de email incorrecto',
      password: (value) => value.length >= 6 ? null : 'La contraseña debe tener al menos 6 caracteres',
      confirm: matchesField('password', 'Las contraseñas no coinciden'),
    },
  })

  const { mutate, isPending, error: errorRegistro } = useRegisterProfesional()
  const { startCountDown, stopCountDown } = useNotificationCountDown()
  const { singingUp } = useGetErrosMsg()
  const getGeneroFormateado = (genero) => {
    if (genero === 'Masculino') return 'M'
    if (genero === 'Femenino') return 'F'
    return 'X'
  }

  const handleRegistro = (values) => {
    notifications.show({
      id: "registrandose",
      title: 'Espera un momento...',
      message: 'Estamos creando tu cuenta.',
      position: 'top-right',
      withCloseButton: false,
      autoClose: false,
      loading: true
    })
    setTimeout(() => {
      mutate({
        dni: values.dni,
        nombre: values.nombre,
        apellido: values.apellido,
        correo: values.correo,
        password: values.password,
        confirm: values.confirm,
        fecha_nacimiento: values.fecha_nacimiento,
        genero: getGeneroFormateado(values.genero),
        numero_matricula: values.numero_matricula
      }, {
        onSuccess: () => {
          startCountDown({
            initialTime: 6,
            notificationConfig: {
              id: "registrandose",
              title: "Cuenta Registrada",
              message: (tiempoRestante) => `Se iniciará sesión en ${tiempoRestante}s`
            }
          })
          login({
            dni: values.dni,
            password: values.password,
            role: 'profesional'
          })
            .then(() => {
              setTimeout(() => {
                notifications.hide("registrandose")
                navigate("/dashboard")
              }, 6000)
            })
            .catch((err) => {
              stopCountDown()
              notifications.update({
                id: "registrandose",
                title: "Atención",
                message: "Cuenta creada exitosamente, pero hubo un error al iniciar sesión automáticamente. Por favor, inicia sesión manualmente.",
                color: 'yellow',
                icon: <IconAlertCircle />,
                loading: false,
                autoClose: 4000,
                withCloseButton: true,
                position: 'top-right',
              })
            })
        },
        onError: (err) => {
          notifications.update({
            id: "registrandose",
            title: err?.code === "DUPLICATE_DNI" || err?.code === "DUPLICATE_EMAIL" ? "Cuenta ya existente" : "Ocurrio un problema registrando su cuenta",
            message: singingUp(err?.code),
            color: 'red',
            icon: <IconX />,
            loading: false,
            autoClose: 4000,
            withCloseButton: true,
            position: 'top-right',
          })
        }
      })
    }, 2000)
  }

  return (
    <Box
      style={{
        backgroundSize: 'cover',
        backgroundImage: `url(${professionalBg})`,
        minHeight: '100vh',
      }}
    >
      <Paper
        radius={0}
        mih="100vh"
        maw={formMaxWidth}
        p={30}
        pt={80}
        pb={80}
        style={{
          borderRight: 'light-dark(1px solid var(--mantine-color-gray-3), 1px solid var(--mantine-color-dark-7))',
        }}
      >
        <Title
          order={2}
          ta="center"
          fw={500}
          mb={50}
        >
          Registrate como profesional
        </Title>

        <form onSubmit={form.onSubmit(handleRegistro)} noValidate>
          <Stack gap="md">
            <TextInput
              label="DNI"
              placeholder="25331874"
              required
              radius="md"
              key={form.key('dni')}
              {...form.getInputProps('dni')}
              error={form.errors.dni || (errorRegistro?.code === 'DUPLICATE_DNI' ? 'DNI ya registrado' : null)}
            />

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Nombre"
                placeholder="Ej: Juan"
                required
                radius="md"
                key={form.key('nombre')}
                {...form.getInputProps('nombre')}
              />
              <TextInput
                label="Apellido"
                placeholder="Ej: Perez"
                required
                radius="md"
                key={form.key('apellido')}
                {...form.getInputProps('apellido')}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <DatePickerInput
                label="Fecha de nacimiento"
                placeholder="Selecciona una fecha"
                required
                radius="md"
                key={form.key('fecha_nacimiento')}
                {...form.getInputProps('fecha_nacimiento')}
                rightSection={<IconCalendar size={20} stroke={1.5} color="gray" />}
                locale="es"
                maxDate={new Date()}
              />
              <Select
                label="Género"
                placeholder="Ej: Masculino"
                required
                radius="md"
                data={opcionesDeGenero}
                key={form.key('genero')}
                {...form.getInputProps('genero')}
              />
            </SimpleGrid>

            <TextInput
              label="Email"
              placeholder="Ej: juanperez@gmail.com"
              required
              radius="md"
              key={form.key('correo')}
              {...form.getInputProps('correo')}
              error={form.errors.correo || (errorRegistro?.code === 'DUPLICATE_EMAIL' ? 'Ya existe una cuenta con este correo' : null)}
            />
            <TextInput
              label="Numero de matricula"
              placeholder="123456789"
              required
              radius="md"
              key={form.key('numero_matricula')}
              {...form.getInputProps('numero_matricula')}
            />

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <PasswordInput
                label="Contraseña"
                placeholder="Escribe tu contraseña"
                required
                radius="md"
                key={form.key('password')}
                {...form.getInputProps('password')}
              />
              <PasswordInput
                label="Confirma tu contraseña"
                placeholder="Escribe de nuevo tu contraseña"
                required
                radius="md"
                key={form.key('confirm')}
                {...form.getInputProps('confirm')}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 3 }} mt="md">
              <Button type="button" onClick={() => navigate('/')} variant="subtle" color="gray">
                Volver al inicio
              </Button>
              <Button type="button" onClick={() => navigate('/professional-login')} variant="default">
                Ya tengo una cuenta
              </Button>
              <Button type="submit" loading={isPending || isLoggingIn}>
                Registrarse
              </Button>
            </SimpleGrid>
          </Stack>
        </form>

        <Text ta="center" mt="md" size="sm">
          ¿Ya tienes una cuenta?{' '}
          <Anchor component={Link} to="/professional-login" fw={500}>
            Inicia sesión aquí
          </Anchor>
        </Text>
      </Paper>
    </Box>
  )
}
