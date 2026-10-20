import { Button, Loader, PasswordInput, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { matchesField, useForm } from '@mantine/form'
import { IconCalendar } from '@tabler/icons-react'
import 'dayjs/locale/es'
import useObrasSociales from '../hooks/useObraSociales.jsx'
import useGetErrosMsg from '../hooks/useGetErrosMsg.jsx'
import { useIsDesktop } from '../hooks/useIsDesktop.js'
import { OPCIONES_GENERO, buildRegistroPayload, isIdentityError, calcularEdad } from '../utils/registro.utils.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ObraSocialSelect({ form, size }) {
  const { data: obras = [], isLoading } = useObrasSociales()

  return (
    <Select
      label="Seleccione una obra social (opcional)"
      size={size}
      placeholder={isLoading ? 'Cargando obras sociales...' : 'Elija una'}
      data={obras.map((obra) => ({ value: obra.id.toString(), label: obra.obra_social }))}
      disabled={isLoading}
      rightSection={isLoading ? <Loader size="xs" /> : null}
      key={form.key('id_obra_social')}
      {...form.getInputProps('id_obra_social')}
    />
  )
}

/**
 * One registration form for every role (cliente, profesional, admin).
 *
 * @param {'cliente'|'profesional'|'admin'} role
 * @param {(payload: object) => void} onSubmit - receives the ready-to-send body
 * @param {object} [error] - last request error; drives inline field errors and
 *   the "existing account password" field
 * @param {string} [lockedDni] - fixed DNI (invitation): shown read-only, never sent
 * @param {string} [lockedCorreo] - fixed correo (invitation): shown read-only, never sent
 * @param {boolean} [hidePersonalData] - the person already exists: only a password is needed
 * @param {{label: string, onClick: () => void, variant?: string}[]} [secondaryActions]
 */
export default function RegisterForm({
  role,
  onSubmit,
  isPending = false,
  error,
  lockedDni,
  lockedCorreo,
  hidePersonalData = false,
  submitLabel = 'Registrarse',
  secondaryActions = [],
}) {
  const isDesktop = useIsDesktop('sm')
  const size = isDesktop ? 'sm' : 'xs'
  const { errorMessage } = useGetErrosMsg()
  const needsIdentity = isIdentityError(error?.code)

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      dni: '', nombre: '', apellido: '', fecha_nacimiento: null, genero: null,
      correo: '', numero_matricula: '', id_obra_social: null,
      password: '', confirm: '', password_cuenta_existente: '',
    },
    validate: {
      password: (value) => (value.length >= 6 ? null : 'La contraseña debe tener al menos 6 caracteres'),
      confirm: matchesField('password', 'Las contraseñas no coinciden'),
      ...(!lockedDni && { dni: (value) => (/^\d{7,8}$/.test(value) ? null : 'El DNI debe tener 7 u 8 dígitos') }),
      ...(!lockedCorreo && { correo: (value) => (EMAIL_RE.test(value) ? null : 'Formato de email incorrecto') }),
      ...(!hidePersonalData && {
        nombre: (value) => (value.trim().length > 0 ? null : 'El nombre es obligatorio'),
        apellido: (value) => (value.trim().length > 0 ? null : 'El apellido es obligatorio'),
        fecha_nacimiento: (value) => {
          if (!value) return 'Selecciona una fecha'
          const d = value instanceof Date ? value : new Date(value)
          if (isNaN(d.getTime())) return 'Fecha inválida'
          if (d > new Date()) return 'La fecha no puede ser futura'
          if ((role === 'profesional' || role === 'admin') && calcularEdad(d) < 18) {
            return 'Debes tener al menos 18 años'
          }
          return null
        },
        genero: (value) => (value ? null : 'Selecciona un género'),
      }),
      ...(role === 'profesional' && {
        numero_matricula: (value) => (value.trim().length > 0 ? null : 'La matrícula es obligatoria'),
      }),
    },
  })

  const handleSubmit = (values) => {
    if (needsIdentity && !values.password_cuenta_existente) {
      form.setFieldError('password_cuenta_existente', 'Ingresá la contraseña de tu cuenta existente')
      return
    }

    onSubmit(buildRegistroPayload(role, values, {
      hidePersonalData,
      includeExistingPassword: needsIdentity,
    }))
  }

  const fieldError = (field, code, fallback) => form.errors[field] || (error?.code === code ? fallback : null)

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <Stack gap="md">
        {lockedDni ? (
          <TextInput label="DNI" size={size} value={lockedDni} readOnly disabled />
        ) : (
          <TextInput
            label="DNI" size={size} placeholder="Ej: 12345678" required
            key={form.key('dni')} {...form.getInputProps('dni')}
            error={fieldError('dni', 'DUPLICATE_DNI', 'DNI ya registrado')}
          />
        )}

        {!hidePersonalData && (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput label="Nombre" size={size} placeholder="Ej: Juan" required key={form.key('nombre')} {...form.getInputProps('nombre')} />
              <TextInput label="Apellido" size={size} placeholder="Ej: Perez" required key={form.key('apellido')} {...form.getInputProps('apellido')} />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <DateInput
                label="Fecha de nacimiento"
                placeholder="DD/MM/AAAA"
                valueFormat="DD/MM/YYYY"
                size={size}
                required
                key={form.key('fecha_nacimiento')}
                {...form.getInputProps('fecha_nacimiento')}
                rightSection={<IconCalendar size={18} stroke={1.5} color="gray" />}
                locale="es"
                defaultLevel="decade"
                defaultDate={new Date(new Date().getFullYear() - 25, 0, 1)}
                maxDate={
                  role === 'profesional' || role === 'admin'
                    ? new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate())
                    : new Date()
                }
              />
              <Select
                label="Género" placeholder="Ej: Masculino" size={size} required data={OPCIONES_GENERO}
                key={form.key('genero')} {...form.getInputProps('genero')}
              />
            </SimpleGrid>
          </>
        )}

        {role === 'cliente' && <ObraSocialSelect form={form} size={size} />}

        {lockedCorreo ? (
          <TextInput label="Email" size={size} value={lockedCorreo} readOnly disabled />
        ) : (
          <TextInput
            label={role === 'cliente' ? 'Email (recibirás notificaciones)' : 'Email'}
            size={size} placeholder="Ej: juanperez@gmail.com" required
            key={form.key('correo')} {...form.getInputProps('correo')}
            error={fieldError('correo', 'DUPLICATE_EMAIL', 'Ya existe una cuenta con este correo')}
          />
        )}

        {role === 'profesional' && (
          <TextInput
            label="Número de matrícula" size={size} placeholder="123456789" required
            key={form.key('numero_matricula')} {...form.getInputProps('numero_matricula')}
            error={fieldError('numero_matricula', 'DUPLICATE_MATRICULA', 'Ya existe una cuenta con esta matrícula')}
          />
        )}

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <PasswordInput
            label="Contraseña" size={size} placeholder="Escribe tu contraseña" required
            key={form.key('password')} {...form.getInputProps('password')}
          />
          <PasswordInput
            label="Confirma tu contraseña" size={size} placeholder="Escribe de nuevo tu contraseña" required
            key={form.key('confirm')} {...form.getInputProps('confirm')}
          />
        </SimpleGrid>

        {needsIdentity && (
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              Este DNI ya tiene una cuenta en Appointly. Para sumar este rol, ingresá la contraseña de esa cuenta.
            </Text>
            <PasswordInput
              label="Contraseña de tu cuenta existente" size={size} required
              key={form.key('password_cuenta_existente')} {...form.getInputProps('password_cuenta_existente')}
              error={form.errors.password_cuenta_existente
                || (error?.code === 'IDENTITY_VERIFICATION_FAILED' ? errorMessage(error.code) : null)}
            />
          </Stack>
        )}

        <SimpleGrid cols={{ base: 1, sm: secondaryActions.length + 1 }} mt="md">
          {secondaryActions.map(({ label, onClick, variant = 'subtle' }) => (
            <Button key={label} type="button" onClick={onClick} variant={variant} color={variant === 'subtle' ? 'gray' : undefined}>
              {label}
            </Button>
          ))}
          <Button type="submit" loading={isPending}>{submitLabel}</Button>
        </SimpleGrid>
      </Stack>
    </form>
  )
}
