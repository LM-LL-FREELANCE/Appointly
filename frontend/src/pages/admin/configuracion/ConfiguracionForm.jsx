import { useEffect } from 'react'
import {
  Button, Chip, CloseButton, Group, NumberInput, Paper, SimpleGrid, Stack, Text, TextInput, ThemeIcon,
} from '@mantine/core'
import { TimeInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconBuildingHospital, IconCalendarCog, IconClock, IconDeviceFloppy,
} from '@tabler/icons-react'
import { useActualizarConfiguracion } from '../../../hooks/useConfiguracion.jsx'
import useGetErrosMsg from '../../../hooks/useGetErrosMsg.jsx'

const DIAS = [
  { value: '1', label: 'L' },
  { value: '2', label: 'M' },
  { value: '3', label: 'X' },
  { value: '4', label: 'J' },
  { value: '5', label: 'V' },
  { value: '6', label: 'S' },
  { value: '0', label: 'D' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const aFormulario = (config) => ({
  nombre_centro: config?.nombre_centro ?? '',
  telefono: config?.telefono ?? '',
  email_institucional: config?.email_institucional ?? '',
  direccion: config?.direccion ?? '',
  dias_habiles: (config?.dias_habiles ?? []).map(String),
  hora_apertura: config?.hora_apertura ?? null,
  hora_cierre: config?.hora_cierre ?? null,
  anticipacion_reserva_min: config?.anticipacion_reserva_min ?? 0,
  limite_cancelacion_horas: config?.limite_cancelacion_horas ?? 0,
})

const aPayload = (values) => ({
  nombre_centro: values.nombre_centro.trim(),
  telefono: values.telefono.trim() || null,
  email_institucional: values.email_institucional.trim() || null,
  direccion: values.direccion.trim() || null,
  dias_habiles: [...values.dias_habiles].map(Number).sort((a, b) => a - b),
  hora_apertura: values.hora_apertura || null,
  hora_cierre: values.hora_cierre || null,
  anticipacion_reserva_min: Number(values.anticipacion_reserva_min) || 0,
  limite_cancelacion_horas: Number(values.limite_cancelacion_horas) || 0,
})

function SeccionTitulo({ icon, children }) {
  return (
    <Group gap="sm" mb="md">
      <ThemeIcon variant="light" size="lg" radius="md">{icon}</ThemeIcon>
      <Text fw={600} fz="lg">{children}</Text>
    </Group>
  )
}

export function ConfiguracionForm({ configuracion }) {
  const { mutate: guardar, isPending } = useActualizarConfiguracion()
  const { errorMessage } = useGetErrosMsg()

  const form = useForm({
    initialValues: aFormulario(configuracion),
    validate: {
      nombre_centro: (value) => {
        if (!value.trim()) return 'El nombre del centro es obligatorio'
        return value.trim().length > 150 ? 'El nombre no puede superar los 150 caracteres' : null
      },
      telefono: (value) => (value.trim().length > 30 ? 'El teléfono es demasiado largo' : null),
      email_institucional: (value) => (
        value.trim() && !EMAIL_RE.test(value.trim()) ? 'El correo no es válido' : null
      ),
      direccion: (value) => (value.trim().length > 255 ? 'La dirección es demasiado larga' : null),
      dias_habiles: (value) => (value.length === 0 ? 'Seleccioná al menos un día hábil' : null),
      hora_apertura: (value, values) => (
        Boolean(value) !== Boolean(values.hora_cierre)
          ? 'Apertura y cierre deben completarse juntos'
          : null
      ),
      hora_cierre: (value, values) => {
        if (!value || !values.hora_apertura) return null
        return value <= values.hora_apertura ? 'El cierre debe ser posterior a la apertura' : null
      },
    },
  })

  // La config llega por query y puede cambiar después de guardar.
  useEffect(() => {
    form.setInitialValues(aFormulario(configuracion), true)
    form.reset()
    // `form` es estable: solo re-sincronizamos cuando cambia la config.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configuracion])

  const submit = (values) => guardar(aPayload(values), {
    onSuccess: () => notifications.show({
      color: 'green',
      title: 'Configuración guardada.',
      message: 'Los cambios ya se aplican a las reservas y cancelaciones.',
      position: 'top-right',
    }),
    onError: (err) => notifications.show({
      color: 'red',
      title: 'No se pudo guardar la configuración',
      message: errorMessage(err.code),
      position: 'top-right',
    }),
  })

  const sinCambios = !form.isDirty()

  return (
    <form onSubmit={form.onSubmit(submit)} noValidate>
      <Stack gap="lg">
        <Paper withBorder radius="md" p="md">
          <SeccionTitulo icon={<IconBuildingHospital size={20} />}>Datos de la institución</SeccionTitulo>
          <Stack gap="md">
            <TextInput
              label="Nombre del centro"
              placeholder="Ej: Centro Médico Appointly"
              required
              maxLength={150}
              {...form.getInputProps('nombre_centro')}
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="Teléfono"
                placeholder="Ej: 11 4000-0000"
                maxLength={30}
                {...form.getInputProps('telefono')}
              />
              <TextInput
                label="Email"
                type="email"
                placeholder="Ej: contacto@centro.com"
                maxLength={255}
                {...form.getInputProps('email_institucional')}
              />
            </SimpleGrid>
            <TextInput
              label="Dirección"
              placeholder="Calle, número, ciudad"
              maxLength={255}
              {...form.getInputProps('direccion')}
            />
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <SeccionTitulo icon={<IconCalendarCog size={20} />}>Políticas de turnos</SeccionTitulo>
          <Stack gap="md">
            <Chip.Group multiple {...form.getInputProps('dias_habiles')}>
              <Group gap="xs" role="group" aria-label="Días hábiles">
                {DIAS.map((dia) => <Chip key={dia.value} value={dia.value}>{dia.label}</Chip>)}
              </Group>
            </Chip.Group>
            <Text fz="sm" c="dimmed">Los días no marcados no ofrecen turnos.</Text>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TimeInput
                label="Apertura"
                leftSection={<IconClock size={16} />}
                rightSection={form.values.hora_apertura ? (
                  <CloseButton
                    size="sm"
                    aria-label="Limpiar apertura"
                    onClick={() => form.setFieldValue('hora_apertura', null)}
                  />
                ) : null}
                {...form.getInputProps('hora_apertura')}
              />
              <TimeInput
                label="Cierre"
                leftSection={<IconClock size={16} />}
                rightSection={form.values.hora_cierre ? (
                  <CloseButton
                    size="sm"
                    aria-label="Limpiar cierre"
                    onClick={() => form.setFieldValue('hora_cierre', null)}
                  />
                ) : null}
                {...form.getInputProps('hora_cierre')}
              />
            </SimpleGrid>
            <Text fz="sm" c="dimmed">
              Recorta los horarios de atención de todos los profesionales. Dejá ambas vacías para no recortar.
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <NumberInput
                label="Anticipación mínima"
                description="0 = sin mínimo. Ej.: 60 = no se ofrecen turnos dentro de la próxima hora."
                min={0}
                max={43200}
                step={5}
                suffix=" min"
                {...form.getInputProps('anticipacion_reserva_min')}
              />
              <NumberInput
                label="Límite de cancelación"
                description="0 = sin límite. Un admin siempre puede cancelar."
                min={0}
                max={720}
                suffix=" hs"
                {...form.getInputProps('limite_cancelacion_horas')}
              />
            </SimpleGrid>
          </Stack>
        </Paper>

        <Group gap="sm" wrap="wrap">
          <Button
            type="submit"
            leftSection={<IconDeviceFloppy size={18} />}
            loading={isPending}
            disabled={sinCambios}
            w={{ base: '100%', sm: 'auto' }}
          >
            Guardar cambios
          </Button>
          {sinCambios && !isPending && <Text fz="sm" c="dimmed">Sin cambios para guardar</Text>}
        </Group>
      </Stack>
    </form>
  )
}
