import { useNavigate } from "react-router-dom"
import { TextInput, Title, Button, Loader, Stack, Paper, SimpleGrid, Select, PasswordInput } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useIsDesktop } from "../hooks/useIsDesktop.js"
import { matchesField, useForm } from "@mantine/form"
import { IconCalendar, IconAlertCircle, IconX } from '@tabler/icons-react';
import useObrasSociales from "../hooks/useObraSociales";
import useCreateAccount from "../hooks/useRegisterAccount";
import { notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import 'dayjs/locale/es';
import useNotificationCountDown from "../hooks/useNotificationCountDown.jsx"
import useGetErrosMsg from "../hooks/useGetErrosMsg.jsx"
import { useAuth } from "../hooks/useAuth.js"

export default function SignUp() {
  const navigate = useNavigate()
  const isDesktop = useIsDesktop('sm')
  const inputSize = isDesktop ? 'sm' : 'xs'

  const opcionesDeGenero = ["Masculino", "Femenino", "Prefiero no decirlo"]

  const { data: obraSociales = [], isLoading: isLoadingObraSociales } = useObrasSociales()

  const opcionesMantine = obraSociales.map((obra) => {
    return {
      value: obra.id.toString(),
      label: obra.obra_social
    };
  })

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      dni: '',
      nombre: '',
      apellido: '',
      fecha_nacimiento: null,
      genero: null,
      id_obra_social: null,
      correo: '',
      password: '',
      confirm: '',
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

  const { mutate, isPending, error: errorAcc } = useCreateAccount()
  const { login, isLoggingIn } = useAuth()
  const { startCountDown, stopCountDown } = useNotificationCountDown()
  const { singingUp } = useGetErrosMsg()

  const getGeneroFormateado = (genero) => {
    if (genero === "Masculino") return "M";
    if (genero === "Femenino") return "F";
    return "X";
  }

  const handleSubmit = (values) => {
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
        id_obra_social: values.id_obra_social ? Number(values.id_obra_social) : null
      }, {
        onSuccess: () => {
          startCountDown({
            initialTime: 6, notificationConfig: {
              id: "registrandose",
              title: "Cuenta Registrada",
              message: (tiempoRestante) => `Se iniciará sesión en ${tiempoRestante}s`
            }
          })
          login({
            dni: values.dni,
            password: values.password,
            role: "cliente"
          })
            .then(() => {
              setTimeout(() => {
                notifications.hide("registrandose")
                navigate("/")
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
    }, 1000)
  }

  return (
    <>
      <Stack align="center" mx="md" justify="center" style={{ minHeight: "100vh" }}>
        <Paper withBorder p="xl" shadow="md" radius="md" w="100%" maw={650}>
          <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
            <Stack px="sm" gap="md">
              <Title order={2} size="h3">Registrarse</Title>

              <Stack>
                <TextInput
                  label="DNI"
                  size={inputSize}
                  placeholder="Ej: 12345678"
                  required
                  key={form.key('dni')}
                  {...form.getInputProps('dni')}
                  error={form.errors.dni || (errorAcc?.code === 'DUPLICATE_DNI' ? 'DNI ya registrado' : null)}
                />
              </Stack>

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput label="Nombre" size={inputSize} placeholder="Ej: Juan" required key={form.key('nombre')} {...form.getInputProps('nombre')} />
                <TextInput label="Apellido" size={inputSize} placeholder="Ej: Perez" required key={form.key('apellido')} {...form.getInputProps('apellido')} />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <DatePickerInput
                  placeholder="Seleccione una fecha"
                  label="Selecciona tu fecha de nacimiento"
                  size={inputSize}
                  key={form.key('fecha_nacimiento')}
                  {...form.getInputProps('fecha_nacimiento')}
                  rightSection={<IconCalendar size={20} stroke={1.5} color="gray" />}
                  locale="es"
                  maxDate={new Date()}
                />
                <Select data={opcionesDeGenero} label="Género" size={inputSize} placeholder="Ej: Masculino" required key={form.key('genero')} {...form.getInputProps('genero')} />
              </SimpleGrid>

              <Stack>
                <Select
                  label="Seleccione una obra social (opcional)"
                  size={inputSize}
                  placeholder={isLoadingObraSociales ? "Cargando obras sociales..." : "Elija una"}
                  data={opcionesMantine}
                  disabled={isLoadingObraSociales}
                  rightSection={isLoadingObraSociales ? <Loader size="xs" /> : null}
                  key={form.key('id_obra_social')}
                  {...form.getInputProps('id_obra_social')}
                />
              </Stack>

              <Stack>
                <TextInput
                  label="Email (recibirás notificaciones)"
                  required
                  size={inputSize}
                  placeholder="Ej: juanperez@gmail.com"
                  key={form.key('correo')}
                  {...form.getInputProps('correo')}
                />
              </Stack>

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <PasswordInput
                  label="Contraseña"
                  size={inputSize}
                  placeholder="Escribe tu contraseña"
                  key={form.key('password')}
                  {...form.getInputProps('password')}
                />
                <PasswordInput
                  label="Confirma tu contraseña"
                  size={inputSize}
                  placeholder="Escribe de nuevo tu contraseña"
                  key={form.key('confirm')}
                  {...form.getInputProps('confirm')}
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 3 }} mt="md">
                <Button type="button" onClick={() => navigate("/")} variant="subtle" color="gray">Volver al inicio</Button>
                <Button type="button" onClick={() => navigate("/login")} >Ya tengo una cuenta</Button>
                <Button
                  type="submit"
                  loading={isPending || isLoggingIn}
                >
                  Registrarse
                </Button>
              </SimpleGrid>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </>
  )
}
