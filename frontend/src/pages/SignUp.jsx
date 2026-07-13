import { useNavigate } from "react-router-dom"
import { TextInput, Title, Button, Loader, Stack, Paper, SimpleGrid, Select, PasswordInput, Group, Alert } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useState } from "react"
import { IconCalendar, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import useObrasSociales from "../hooks/useObraSociales";
import useCreateAccount from "../hooks/useRegisterAccount";
import 'dayjs/locale/es'; // Importante para que funcione locale="es"

export default function SignUp() {
  const navigate = useNavigate()
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
  const [accConfirm, setAccConfirm] = useState(false)

  const getGeneroFormateado = () => {
    if (genero === "Masculino") return "M";
    if (genero === "Femenino") return "F";
    return "X"; // Aplica para "Otro" o si está vacío
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

      }
    })
  }

  return (
    <>
      <Stack align="center" mx="md" justify="center" style={{ minHeight: "100vh" }}>
        <Paper p="xl" shadow="md" radius="md" w="100%" maw={650}>
          <Stack px="sm" gap="md">
            <Title order={2} size="h3">Registrarse</Title>

            {/* Mensajes de feedback (Opcional, pero muy recomendado) */}
            {accConfirm && (
              <Alert icon={<IconCheck size={16} />} color="green" title="¡Cuenta Creada!">
                Tu cuenta fue registrada exitosamente. Ya puedes iniciar sesión.
              </Alert>
            )}

            {errorAcc && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
                {JSON.stringify(errorAcc).includes("DUPLICATE_DNI")
                  ? "Ya existe una cuenta registrada con este DNI. Si es tuyo, intenta iniciar sesión."
                  : "Hubo un problema al registrar la cuenta. Por favor, intenta de nuevo."}
              </Alert>
            )}

            <Stack>
              <TextInput
                error={errorAcc && JSON.stringify(errorAcc).includes("DUPLICATE_DNI") ? "DNI ya registrado" : null}
                label="DNI"
                size="sm"
                placeholder="Ej: 12345678"
                required
                value={dni}
                onChange={(e) => setDni(e.target.value)}
              />
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {/* Le quité los style={{flex: 1}} porque dentro de SimpleGrid no hacen falta */}
              <TextInput label="Nombre" size="sm" placeholder="Ej: Juan" required value={name} onChange={(e) => setName(e.target.value)} />
              <TextInput label="Apellido" size="sm" placeholder="Ej: Perez" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <DatePickerInput
                placeholder="Seleccione una fecha"
                label="Selecciona tu fecha de nacimiento"
                value={fecha}
                onChange={setFecha} // Forma más corta y limpia
                rightSection={<IconCalendar size={20} stroke={1.5} color="gray" />}
                locale="es"
              />
              <Select data={opcionesDeGenero} label="Género" size="sm" placeholder="Ej: Masculino" required value={genero} onChange={setGenero} />
            </SimpleGrid>

            <Stack>
              <Select
                label="Seleccione una obra social (opcional)"
                value={obraSocial}
                onChange={setObraSocial}
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
                size="sm"
                placeholder="Ej: juanperez@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <PasswordInput
                label="Contraseña"
                placeholder="Escribe tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordInput
                error={contrasenasNoCoinciden ? "Las contraseñas no coinciden" : null}
                label="Confirma tu contraseña"
                placeholder="Escribe de nuevo tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </SimpleGrid>

            <Group justify="space-between" mt="md">
              <Button onClick={() => navigate("/")} variant="subtle" color="gray">Volver a la página de inicio</Button>
              <Group gap="md">
                <Button onClick={() => navigate("/login")} variant="subtle" color="gray">Ya tengo una cuenta</Button>

                {/* Deshabilitamos el botón si hay errores, si faltan datos o si está cargando */}
                <Button
                  disabled={contrasenasNoCoinciden || emailInvalido || !dni || !name || !email || !password}
                  loading={isPending} // Mantine te pone un loader automáticamente en el botón
                  onClick={confirmarAcc}
                >
                  Registrarse
                </Button>
              </Group>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </>
  )
}