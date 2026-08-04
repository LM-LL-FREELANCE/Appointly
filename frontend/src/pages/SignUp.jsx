import { useNavigate } from "react-router-dom"
import { TextInput, Title, Button, Loader, Stack, Paper, SimpleGrid, Select, PasswordInput, Alert, Group } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useMediaQuery } from "@mantine/hooks"
import { useState } from "react"
import { IconCalendar, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import useObrasSociales from "../hooks/useObraSociales";
import useCreateAccount from "../hooks/useRegisterAccount";
import useLoginSession from "../hooks/useLoginSession";
import 'dayjs/locale/es';

export default function SignUp() {
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const inputSize = isMobile ? 'xs' : 'sm'
  const [dni, setDni] = useState("")
  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [fecha, setFecha] = useState(null)

  const [genero, setGenero] = useState(null)
  const opcionesDeGenero = ["Masculino", "Femenino", "Prefiero no decirlo"]

  const [obraSocial, setObraSocial] = useState(null)
  const { data: obraSociales = [], isLoading: isLoadingObraSociales } = useObrasSociales()

  const opcionesMantine = obraSociales.map((obra) => {
    return {
      value: obra.id.toString(),
      label: obra.obra_social
    };
  })

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const contrasenasNoCoinciden = confirmPassword.length > 0 && password !== confirmPassword;

  const [email, setEmail] = useState("") // Cuidado, estaba en null. Mejor "" para textos.
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailInvalido = email.length > 0 && !regexEmail.test(email);

  const { mutate, isPending, error: errorAcc } = useCreateAccount()
  const { mutate: mutateLogin, isPending: isLoginIn, error: isErrorLoginIn } = useLoginSession()
  const [accConfirm, setAccConfirm] = useState(false)

  const getGeneroFormateado = () => {
    if (genero === "Masculino") return "M";
    if (genero === "Femenino") return "F";
    return "X";
  }

  const confirmarAcc = () => {
    mutate({
      dni: dni,
      nombre: name,
      apellido: lastName,
      correo: email,
      password: password,
      confirm: confirmPassword,
      fecha_nacimiento: fecha,
      genero: getGeneroFormateado(),
      id_obra_social: obraSocial ? Number(obraSocial) : null
    }, {
      onSuccess: () => {
        setAccConfirm(true)
        mutateLogin({
          dni: dni,
          password: password,
          role: "cliente"
        }, {
          onSuccess: () => {
            setTimeout(() => {
              navigate("/")
            }, 1000)
          },
        })
      }
    })
  }

  return (
    <>
      <Stack align="center" mx="md" justify="center" style={{ minHeight: "100vh" }}>
        <Paper withBorder p="xl" shadow="md" radius="md" w="100%" maw={650}>
          <Stack px="sm" gap="md">
            <Title order={2} size="h3">Registrarse</Title>

            <Stack>
              <TextInput
                error={errorAcc?.code === "DUPLICATE_DNI" ? "DNI ya registrado" : null}
                label="DNI"
                size={inputSize}
                placeholder="Ej: 12345678"
                required
                value={dni}
                onChange={(e) => setDni(e.target.value)}
              />
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {/* Le quité los style={{flex: 1}} porque dentro de SimpleGrid no hacen falta */}
              <TextInput label="Nombre" size={inputSize} placeholder="Ej: Juan" required value={name} onChange={(e) => setName(e.target.value)} />
              <TextInput label="Apellido" size={inputSize} placeholder="Ej: Perez" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <DatePickerInput
                placeholder="Seleccione una fecha"
                label="Selecciona tu fecha de nacimiento"
                size={inputSize}
                value={fecha}
                onChange={setFecha} // Forma más corta y limpia
                rightSection={<IconCalendar size={20} stroke={1.5} color="gray" />}
                locale="es"
                maxDate={new Date()}
              />
              <Select data={opcionesDeGenero} label="Género" size={inputSize} placeholder="Ej: Masculino" required value={genero} onChange={setGenero} />
            </SimpleGrid>

            <Stack>
              <Select
                label="Seleccione una obra social (opcional)"
                value={obraSocial}
                onChange={setObraSocial}
                size={inputSize}
                placeholder={isLoadingObraSociales ? "Cargando obras sociales..." : "Elija una"}
                data={opcionesMantine}
                disabled={isLoadingObraSociales}
                rightSection={isLoadingObraSociales ? <Loader size="xs" /> : null}
              />
            </Stack>

            <Stack>
              <TextInput
                error={emailInvalido ? "Formato de email incorrecto" : null}
                label="Email (recibirás notificaciones)"
                required
                size={inputSize}
                placeholder="Ej: juanperez@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <PasswordInput
                label="Contraseña"
                size={inputSize}
                placeholder="Escribe tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordInput
                error={contrasenasNoCoinciden ? "Las contraseñas no coinciden" : null}
                label="Confirma tu contraseña"
                size={inputSize}
                placeholder="Escribe de nuevo tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 3 }} mt="md">
              <Button onClick={() => navigate("/")} variant="subtle" color="gray">Volver al inicio</Button>
              <Button onClick={() => navigate("/login")} >Ya tengo una cuenta</Button>
              <Button
                disabled={contrasenasNoCoinciden || emailInvalido || !dni || !name || !lastName || !email || !password || !fecha || !genero}
                loading={isPending || isLoginIn} // Mantine te pone un loader automáticamente en el botón
                onClick={confirmarAcc}
              >
                Registrarse
              </Button>
            </SimpleGrid>
            <Group align="center">
              {accConfirm && (
                <Alert style={{ flex: 1 }} icon={<IconCheck size={16} />} color="green" title="¡Cuenta Creada!">
                  Tu cuenta fue registrada exitosamente. Ya puedes iniciar sesión.
                </Alert>
              )}

              {errorAcc && (
                <Alert style={{ flex: 1 }} icon={<IconAlertCircle size={16} />} color="red" title="Error">
                  {errorAcc?.code === "DUPLICATE_DNI"
                    ? "Ya existe una cuenta registrada con este DNI. Si es tuyo, intenta iniciar sesión."
                    : "Hubo un problema al registrar la cuenta. Por favor, intenta de nuevo."}
                </Alert>
              )}
              {isErrorLoginIn && (
                <>
                  <Alert style={{ flex: 1 }} icon={<IconAlertCircle size={16} />} color="red" title="Error">
                    A ocurrido un error al querer iniciar su sesion, porfavor aprete el siguiente boton para iniciar sesion con su cuenta.
                  </Alert>
                  <Button onClick={() => navigate("/login")}>Iniciar Sesion</Button>
                </>
              )}
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </>
  )
}