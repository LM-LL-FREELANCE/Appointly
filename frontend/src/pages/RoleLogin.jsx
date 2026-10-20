import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Anchor,
  Box,
  Button,
  Center,
  Group,
  Paper,
  PasswordInput,
  PinInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  useMatches,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import '@mantine/notifications/styles.css'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { IconAlertCircle, IconRefresh, IconShieldLock, IconX } from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth.js'
import useSentEmailPassword from '../hooks/useSentEmailPassword.jsx'
import useNotificationCountDown from '../hooks/useNotificationCountDown.jsx'
import useGetErrosMsg from '../hooks/useGetErrosMsg.jsx'
import { EnviarCorreo } from '../components/EmailModal.jsx'
import { getMe } from '../api/api.js'
import { disconnectSocket, getSocket } from '../socket/client.js'
import { HOME_BY_ROLE } from '../utils/roles.js'
import professionalBg from '../assets/images/professionals-bg.svg'

// Login screen shared by the roles that sign in outside the patient flow.
// Both profesional and admin join exclusively by invitation.
const ROLE_CONFIG = {
  profesional: { signupPath: null },
  admin: { signupPath: null },
}

const MFA_PIN_LENGTH = 6
const MFA_RESEND_SECONDS = 60

const formatearReenvio = (segundos) => {
  const minutos = Math.floor(segundos / 60)
  const resto = String(segundos % 60).padStart(2, '0')
  return `Reenviar en ${minutos}:${resto}`
}

export default function RoleLogin({ role = 'profesional' }) {
  const { signupPath } = ROLE_CONFIG[role]
  const { errorMessage } = useGetErrosMsg()

  const {
    login, isLoggingIn, loginError, resetLogin,
    verificarMfa, isVerifyingMfa, reenviarMfa, isResendingMfa,
  } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [forgotPassWordModal, { open: openforgotPassWordModal, close: closeforgotPassWordModal }] = useDisclosure(false)
  const [email, setEmail] = useState('')
  const { mutate: mutateEmail, isPending: isPendingEmail } = useSentEmailPassword()
  const { startCountDown, time, setTime, stopCountDown } = useNotificationCountDown()
  const notAvailable = time > 0

  // MFA (solo admin): el login devuelve un challenge y la cookie se emite recién
  // al verificar el código (PLAN_ADMIN.md §10).
  const [paso, setPaso] = useState('credenciales')
  const [challenge, setChallenge] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [errorCodigo, setErrorCodigo] = useState('')
  const [intentosRestantes, setIntentosRestantes] = useState(null)
  const [bloqueado, setBloqueado] = useState(false)
  const [segundosReenvio, setSegundosReenvio] = useState(0)
  const [resaltarReenvio, setResaltarReenvio] = useState(false)
  const [pinKey, setPinKey] = useState(0)

  const verificadoRef = useRef(false)
  const navegandoRef = useRef(false)
  const pinContainerRef = useRef(null)

  const navegarAlPanel = useCallback(() => {
    if (navegandoRef.current) return
    navegandoRef.current = true
    navigate(HOME_BY_ROLE.admin)
  }, [navigate])

  const handleCloseModal = () => {
    setTime(0)
    notifications.hide('volverEnviar')
    closeforgotPassWordModal()
  }

  const handleSend = () => {
    mutateEmail({
      correo: email,
      role,
    }, {
      onSuccess: () => {
        startCountDown({
          initialTime: 60,
          notificationConfig: {
            id: 'volverEnviar',
            title: 'Correo enviado',
            message: (tiempoRestante) => `Podrás enviar otro correo en ${tiempoRestante}s`,
          },
        })
      },
      onError: () => {
        stopCountDown()
        notifications.show({
          id: 'errorEnviar',
          title: 'Error al enviar',
          message: 'Sucedió un error, verificá que todo lo que ingresaste es correcto.',
          color: 'red',
          icon: <IconX />,
          autoClose: 3000,
          withCloseButton: true,
          position: 'top-right',
        })
      },
    })
  }

  async function handleLogin(values) {
    try {
      verificadoRef.current = false
      navegandoRef.current = false

      const result = await login(values)

      if (result?.mfa_required) {
        setPaso('mfa')
        setChallenge(result.challenge)
        setCodigo('')
        setErrorCodigo('')
        setIntentosRestantes(null)
        setBloqueado(false)
        setResaltarReenvio(false)
        setSegundosReenvio(MFA_RESEND_SECONDS)
        setPinKey((key) => key + 1)
        return
      }

      navigate(HOME_BY_ROLE[role])
    } catch (error) {
      console.error('Login fallido:', error)
    }
  }

  // Countdown del reenvío: se reinicia al recibir el código y con cada reenvío.
  useEffect(() => {
    if (segundosReenvio <= 0) return undefined

    const timeout = setTimeout(() => {
      setSegundosReenvio((segundos) => Math.max(0, segundos - 1))
    }, 1000)

    return () => clearTimeout(timeout)
  }, [segundosReenvio])

  // Foco en el primer dígito al entrar al paso 2 y después de cada código
  // incorrecto (el PinInput se remonta con `pinKey`).
  useEffect(() => {
    if (paso !== 'mfa' || bloqueado) return

    const input = pinContainerRef.current?.querySelector('input')
    input?.focus()
  }, [paso, pinKey, bloqueado])

  // Socket del desafío: solo refleja estado (código enviado, intentos,
  // verificado/bloqueado). La validación siempre va por HTTP.
  useEffect(() => {
    if (paso !== 'mfa' || !challenge) return undefined

    const socket = getSocket({ mfa: challenge })

    const handleCodigoEnviado = () => {
      setSegundosReenvio(MFA_RESEND_SECONDS)
      setErrorCodigo('')
    }

    const handleIntentoFallido = ({ restantes } = {}) => {
      if (typeof restantes !== 'number') return
      setIntentosRestantes(restantes)
      if (restantes <= 0) setBloqueado(true)
    }

    const handleVerificado = async () => {
      // Si la verificación salió por HTTP en esta pestaña, este evento llega
      // mientras el request está en vuelo: se ignora para no navegar dos veces.
      if (verificadoRef.current) return
      verificadoRef.current = true

      try {
        const user = await getMe()
        if (!user) {
          verificadoRef.current = false
          return
        }
        queryClient.setQueryData(['auth', 'me'], user)
        navegarAlPanel()
      } catch {
        verificadoRef.current = false
      }
    }

    const handleBloqueado = () => {
      setBloqueado(true)
      setCodigo('')
      setIntentosRestantes(0)
    }

    socket.on('mfa:codigo_enviado', handleCodigoEnviado)
    socket.on('mfa:intento_fallido', handleIntentoFallido)
    socket.on('mfa:verificado', handleVerificado)
    socket.on('mfa:bloqueado', handleBloqueado)

    return () => {
      socket.off('mfa:codigo_enviado', handleCodigoEnviado)
      socket.off('mfa:intento_fallido', handleIntentoFallido)
      socket.off('mfa:verificado', handleVerificado)
      socket.off('mfa:bloqueado', handleBloqueado)
      disconnectSocket()
    }
  }, [paso, challenge, navegarAlPanel, queryClient])

  function volverACredenciales() {
    if (isVerifyingMfa || isResendingMfa) return

    setPaso('credenciales')
    setChallenge(null)
    setCodigo('')
    setErrorCodigo('')
    setIntentosRestantes(null)
    setBloqueado(false)
    setSegundosReenvio(0)
    setResaltarReenvio(false)
    verificadoRef.current = false
    navegandoRef.current = false
    resetLogin()
  }

  async function handleVerificar(event) {
    event?.preventDefault()
    if (codigo.length !== MFA_PIN_LENGTH || bloqueado || isVerifyingMfa) return

    setErrorCodigo('')
    setIntentosRestantes(null)
    setResaltarReenvio(false)
    // Evita que el evento socket `mfa:verificado` (que sale antes de la
    // respuesta HTTP) dispare una segunda navegación.
    verificadoRef.current = true

    try {
      await verificarMfa({ challenge, codigo })
      navegarAlPanel()
    } catch (error) {
      verificadoRef.current = false
      setCodigo('')
      setPinKey((key) => key + 1)

      if (error?.code === 'MFA_CHALLENGE_INVALID') {
        volverACredenciales()
        notifications.show({
          color: 'red',
          title: 'La verificación venció. Iniciá sesión de nuevo.',
          position: 'top-right',
        })
        return
      }

      if (error?.code === 'MFA_TOO_MANY_ATTEMPTS') {
        setBloqueado(true)
        setIntentosRestantes(0)
        return
      }

      if (error?.code === 'MFA_EXPIRED') {
        setErrorCodigo('El código venció. Pedí uno nuevo.')
        setResaltarReenvio(true)
        return
      }

      if (error?.code === 'MFA_INVALID_CODE') {
        setErrorCodigo('El código no es correcto. Revisá el correo e intentá de nuevo.')
        return
      }

      setErrorCodigo(errorMessage(error?.code))
    }
  }

  async function handleReenviar() {
    if (!challenge || segundosReenvio > 0 || bloqueado || isResendingMfa) return

    try {
      await reenviarMfa({ challenge })
      setSegundosReenvio(MFA_RESEND_SECONDS)
      setCodigo('')
      setErrorCodigo('')
      setIntentosRestantes(null)
      setResaltarReenvio(false)
      setPinKey((key) => key + 1)
      notifications.show({
        color: 'green',
        title: 'Código reenviado',
        message: 'Te enviamos un código nuevo. El anterior ya no sirve.',
        position: 'top-right',
      })
    } catch (error) {
      if (error?.code === 'MFA_CHALLENGE_INVALID') {
        volverACredenciales()
        notifications.show({
          color: 'red',
          title: 'La verificación venció. Iniciá sesión de nuevo.',
          position: 'top-right',
        })
        return
      }

      notifications.show({
        color: 'red',
        title: 'No se pudo reenviar el código',
        message: errorMessage(error?.code),
        position: 'top-right',
      })
    }
  }

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      dni: '',
      password: '',
      role,
    },
    validate: {
      dni: (value) => (/^\d{7,8}$/).test(value) ? null : 'El DNI debe tener 7 u 8 dígitos',
    },
  })

  const mensajeLogin = loginError
    ? (loginError.code === 'ACCOUNT_SUSPENDED'
      ? errorMessage('ACCOUNT_SUSPENDED')
      : 'Credenciales no válidas')
    : null

  const formMaxWidth = useMatches({
    base: '100%',
    sm: 450,
  })

  return (
    <>
      <Box
        mih={900}
        style={{
          backgroundSize: 'cover',
          backgroundImage: `url(${professionalBg})`,
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
          {paso === 'credenciales' ? (
            <>
              <Title order={2} ta="center" fw={500} mt="md" mb={50}>
                ¡Bienvenido!
              </Title>

              <form onSubmit={(event) => form.onSubmit(handleLogin)(event)} noValidate>
                <TextInput
                  label="DNI"
                  placeholder="25331874"
                  key={form.key('dni')}
                  {...form.getInputProps('dni')}
                  radius="md"
                  required
                />
                <PasswordInput
                  label="Contraseña"
                  placeholder="Tu contraseña"
                  key={form.key('password')}
                  {...form.getInputProps('password')}
                  mt="md"
                  radius="md"
                  required
                />
                <Button fullWidth mt="xl" radius="md" type="submit" loading={isLoggingIn}>
                  Iniciar sesión
                </Button>
              </form>

              {mensajeLogin ? (
                <Text c="red" size="sm" mt="md" ta="center">{mensajeLogin}</Text>
              ) : (
                <Text mb={51} />
              )}

              <Center>
                <Stack gap="md">
                  <Anchor
                    align="center"
                    fw={500}
                    component="button"
                    type="button"
                    size="sm"
                    onClick={openforgotPassWordModal}
                  >
                    ¿Olvidaste tu contraseña?
                  </Anchor>
                  {signupPath && (
                    <Text ta="center" size="sm">
                      ¿Todavía no tenés una cuenta?{' '}
                      <Anchor component={Link} to={signupPath} fw={500}>
                        Solicitá tu cuenta
                      </Anchor>
                    </Text>
                  )}
                </Stack>
              </Center>
            </>
          ) : (
            <Stack align="center" gap="md" mt="xl">
              <ThemeIcon size={56} radius="xl" variant="light">
                <IconShieldLock size={30} />
              </ThemeIcon>
              <Title order={3} ta="center">Verificá tu identidad</Title>
              <Text c="dimmed" fz="sm" ta="center" lh={1.6}>
                Te enviamos un código de 6 dígitos a tu correo.<br />
                Vence en 10 minutos.
              </Text>

              {bloqueado ? (
                <Alert
                  color="red"
                  variant="light"
                  icon={<IconAlertCircle size={18} />}
                  title="Demasiados intentos incorrectos."
                  w="100%"
                >
                  <Button variant="light" color="red" size="xs" mt="xs" onClick={volverACredenciales}>
                    Volver a empezar
                  </Button>
                </Alert>
              ) : (
                <form onSubmit={handleVerificar} noValidate style={{ width: '100%' }}>
                  <Stack gap="md">
                    <Box ref={pinContainerRef}>
                      <Group justify="center">
                        <PinInput
                          key={pinKey}
                          length={MFA_PIN_LENGTH}
                          type="number"
                          oneTimeCode
                          size="md"
                          gap="sm"
                          value={codigo}
                          onChange={setCodigo}
                          disabled={isVerifyingMfa}
                          data-autofocus
                          aria-label="Código de verificación"
                        />
                      </Group>
                    </Box>

                    {errorCodigo && (
                      <Text c="red" size="sm" ta="center" aria-live="polite">
                        {errorCodigo}
                      </Text>
                    )}

                    {typeof intentosRestantes === 'number' && intentosRestantes > 0 && (
                      <Text c="dimmed" size="sm" ta="center" aria-live="polite">
                        Te quedan {intentosRestantes} intentos.
                      </Text>
                    )}

                    <Button
                      fullWidth
                      type="submit"
                      radius="md"
                      loading={isVerifyingMfa}
                      disabled={codigo.length !== MFA_PIN_LENGTH}
                    >
                      Verificar código
                    </Button>

                    <Button
                      variant="subtle"
                      size="sm"
                      leftSection={<IconRefresh size={16} />}
                      color={resaltarReenvio ? 'yellow' : undefined}
                      onClick={handleReenviar}
                      disabled={segundosReenvio > 0 || isResendingMfa}
                      loading={isResendingMfa}
                    >
                      {segundosReenvio > 0 ? formatearReenvio(segundosReenvio) : 'Reenviar código'}
                    </Button>
                  </Stack>
                </form>
              )}

              <Anchor
                component="button"
                type="button"
                c="dimmed"
                fz="sm"
                mt="xs"
                onClick={volverACredenciales}
              >
                ← Volver al inicio de sesión
              </Anchor>
            </Stack>
          )}
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
          isNotAvailble={notAvailable}
        />
      )}
    </>
  )
}
